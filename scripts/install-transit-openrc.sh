#!/bin/sh
# Install the official Transit 1.4.5 helper on an active Alpine/OpenRC system.
# Run as root: sh install-transit-openrc.sh --endpoint https://status.example.com
# The supervised helper runs as root so ICMP traceroute can use CAP_NET_RAW.
# Agent credentials are read from /dev/tty or reused from the existing config.
set -eu
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
export PATH
umask 077

TRANSIT_RELEASE=v1.4.5
TRANSIT_BASE=https://github.com/yyy622hhh/komari-theme-transit/releases/download/$TRANSIT_RELEASE
TRANSIT_INSTALL_DIR=/usr/local/libexec/transit-route-probe
TRANSIT_CONFIG=/etc/transit-route-probe.conf
TRANSIT_SERVICE=/etc/init.d/transit-route-probe
TRANSIT_LOG=/var/log/transit-route-probe.log
transit_endpoint=
transit_replace_token=0
transit_token=
transit_work=
transit_config_temp=
transit_service_temp=
transit_helper_temp=
transit_collector_temp=
transit_tty_saved=
transit_lock=

fail() {
  printf 'Transit OpenRC: %s\n' "$*" >&2
  exit 1
}

cleanup() {
  transit_status=$?
  trap - EXIT HUP INT TERM
  set +e
  if [ -n "$transit_tty_saved" ]; then
    stty "$transit_tty_saved" </dev/tty
    printf '\n' >/dev/tty
  fi
  for transit_temp in "$transit_config_temp" "$transit_service_temp" "$transit_helper_temp" "$transit_collector_temp"; do
    [ -z "$transit_temp" ] || rm -f -- "$transit_temp"
  done
  if [ -n "$transit_work" ]; then
    rm -f -- "$transit_work/helper.sh" "$transit_work/collect-return-route.sh" "$transit_work/service"
    rmdir -- "$transit_work"
  fi
  [ -z "$transit_lock" ] || rmdir -- "$transit_lock"
  unset transit_token
  if [ "$transit_status" -ne 0 ]; then
    printf 'Transit OpenRC: installation did not complete; inspect the error above.\n' >&2
  fi
  exit "$transit_status"
}
trap cleanup EXIT
trap 'exit 129' HUP
trap 'exit 130' INT
trap 'exit 143' TERM

usage() {
  printf '%s\n' 'Usage: sh install-transit-openrc.sh --endpoint https://status.example.com [--replace-token]'
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --endpoint)
      [ "$#" -ge 2 ] || fail '--endpoint requires a value'
      [ -z "$transit_endpoint" ] || fail '--endpoint may only be specified once'
      transit_endpoint=${2%/}
      shift 2
      ;;
    --replace-token) transit_replace_token=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) fail "unsupported argument: $1" ;;
  esac
done
[ -n "$transit_endpoint" ] || { usage >&2; fail '--endpoint is required'; }
# Reject line breaks before using the line-oriented URL check.
[ "$(printf '%s' "$transit_endpoint" | wc -l)" -eq 0 ] || fail 'invalid endpoint'
printf '%s\n' "$transit_endpoint" | LC_ALL=C grep -Eq '^https://([A-Za-z0-9][A-Za-z0-9.-]*|\[[0-9A-Fa-f:]+\])(:[0-9]{1,5})?$' || fail 'endpoint must be an HTTPS origin without a path, user info, query or fragment'

[ "$(id -u)" -eq 0 ] || fail 'run this installer as root'
[ -r /etc/os-release ] || fail '/etc/os-release is unavailable'
transit_os=$(sed -n 's/^ID=//p' /etc/os-release | head -n 1 | tr -d '"')
[ "$transit_os" = alpine ] || fail 'this installer only supports Alpine Linux'
for transit_command in apk rc-service rc-update rc-status; do
  command -v "$transit_command" >/dev/null 2>&1 || fail "missing command: $transit_command"
done
[ -x /sbin/openrc-run ] || fail '/sbin/openrc-run is unavailable'
# Do not fabricate /run/openrc/softlevel in containers that have no active init.
[ -s /run/openrc/softlevel ] || fail 'OpenRC is not active; no service or boot configuration has been changed'
transit_pid1=$(cat /proc/1/comm 2>/dev/null || true)
case "$transit_pid1" in
  init|openrc-init) : ;;
  *) fail "PID 1 is '$transit_pid1'; confirm the container boot manager before installing an OpenRC service" ;;
esac
rc-status --runlevel >/dev/null 2>&1 || fail 'OpenRC cannot report its current runlevel'
mkdir /run/transit-route-probe-install.lock 2>/dev/null || fail 'another installation lock exists at /run/transit-route-probe-install.lock'
transit_lock=/run/transit-route-probe-install.lock

printf 'Installing runtime dependencies with apk...\n'
apk add --no-cache bash curl ca-certificates coreutils || fail 'apk could not install the base runtime dependencies'
traceroute_compatible() {
  command -v traceroute >/dev/null 2>&1 || return 1
  transit_trace_help=$(LC_ALL=C traceroute --help 2>&1 || true)
  for transit_flag in I n q w m; do
    printf '%s\n' "$transit_trace_help" | grep -Eq -- "(^|[[:space:]])-$transit_flag([[:space:],=]|$)" || return 1
  done
}
if traceroute_compatible; then
  printf 'Using the existing compatible traceroute: %s\n' "$(command -v traceroute)"
else
  apk add --no-cache traceroute || fail 'no compatible traceroute is available; its package requires the matching Alpine community repository (repositories were not changed)'
  hash -r
  traceroute_compatible || fail 'traceroute does not advertise the required -I, -n, -q, -w and -m options'
fi
for transit_command in bash curl timeout traceroute sha256sum supervise-daemon; do
  command -v "$transit_command" >/dev/null 2>&1 || fail "dependency is unavailable after apk: $transit_command"
done

transit_work=$(mktemp -d /tmp/transit-route-probe-openrc.XXXXXXXX) || fail 'cannot create a private download directory'
curl -q --proto '=https' --proto-redir '=https' --connect-timeout 15 --max-time 120 -fsSL "$TRANSIT_BASE/transit-route-probe-helper.sh" -o "$transit_work/helper.sh"
curl -q --proto '=https' --proto-redir '=https' --connect-timeout 15 --max-time 120 -fsSL "$TRANSIT_BASE/transit-collect-return-route.sh" -o "$transit_work/collect-return-route.sh"
printf '%s  %s\n' \
  dc78007167efe18e0652024f5a187aaa595ecf102dff4c4b82df8e54f1ef4249 "$transit_work/helper.sh" \
  65220f08cc18eb3a85ef597fb57c885d5e79864d1965e2796feb4c928d629d9d "$transit_work/collect-return-route.sh" | sha256sum -c -
bash -n "$transit_work/helper.sh"
bash -n "$transit_work/collect-return-route.sh"
# Source only the pinned helper's function definitions; never run its installer.
bash -c '. "$1"; ALLOW_INSECURE_HTTP=0; valid_endpoint "$2"' transit-openrc "$transit_work/helper.sh" "$transit_endpoint" || fail 'endpoint port or format is not accepted by the official helper'

for transit_path in "$TRANSIT_INSTALL_DIR" "$TRANSIT_CONFIG" "$TRANSIT_SERVICE" "$TRANSIT_LOG"; do
  [ ! -L "$transit_path" ] || fail "refusing to replace a symbolic link: $transit_path"
done
valid_token() {
  [ -n "$1" ] && [ "${#1}" -le 512 ] || return 1
  case "$1" in *[!A-Za-z0-9._~-]*) return 1 ;; esac
}
if [ "$transit_replace_token" -eq 0 ] && [ -f "$TRANSIT_CONFIG" ]; then
  transit_token=$(sed -n 's/^token=//p' "$TRANSIT_CONFIG" | head -n 1)
  if valid_token "$transit_token"; then
    printf 'Reusing the existing helper token (not displayed).\n'
  else
    transit_token=
  fi
fi
if [ -z "$transit_token" ]; then
  [ -r /dev/tty ] && [ -w /dev/tty ] || fail 'an interactive terminal is required to enter the Agent token'
  transit_tty_saved=$(stty -g </dev/tty) || fail 'cannot read terminal settings'
  printf 'Enter this node\047s Komari Agent token (hidden): ' >/dev/tty
  stty -echo </dev/tty
  IFS= read -r transit_token </dev/tty || fail 'token input was interrupted'
  stty "$transit_tty_saved" </dev/tty
  transit_tty_saved=
  printf '\n' >/dev/tty
fi
valid_token "$transit_token" || fail 'Agent token format is invalid'

cat >"$transit_work/service" <<'TRANSIT_OPENRC_SERVICE'
#!/sbin/openrc-run
# Managed by the Ichigo Alpine/OpenRC Transit helper installer.
name="Transit Route Probe"
description="Fixed-purpose Transit return-route helper"
supervisor="supervise-daemon"
command="/bin/bash"
command_args="/usr/local/libexec/transit-route-probe/helper.sh run --config /etc/transit-route-probe.conf"
command_user="root:root"
pidfile="/run/transit-route-probe.pid"
respawn_delay=15
respawn_max=0
retry="SIGTERM/5/SIGKILL/5"
stopgroup="yes"
umask="0077"
output_log="/var/log/transit-route-probe.log"
error_log="/var/log/transit-route-probe.log"
required_files="/etc/transit-route-probe.conf /usr/local/libexec/transit-route-probe/helper.sh /usr/local/libexec/transit-route-probe/collect-return-route.sh"
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
export RUNTIME_DIRECTORY="/run/transit-route-probe"

depend() {
  use net
  after firewall
}

start_pre() {
  checkpath --directory --mode 0700 --owner root:root "$RUNTIME_DIRECTORY" || return 1
  checkpath --file --mode 0600 --owner root:root /var/log/transit-route-probe.log || return 1
}
TRANSIT_OPENRC_SERVICE
sh -n "$transit_work/service"
install -d -m 0755 -o root -g root "$TRANSIT_INSTALL_DIR"
transit_helper_temp=$(mktemp "$TRANSIT_INSTALL_DIR/.helper.XXXXXXXX")
transit_collector_temp=$(mktemp "$TRANSIT_INSTALL_DIR/.collector.XXXXXXXX")
transit_config_temp=$(mktemp /etc/transit-route-probe.conf.tmp.XXXXXXXX)
transit_service_temp=$(mktemp /etc/init.d/.transit-route-probe.XXXXXXXX)
cat "$transit_work/helper.sh" >"$transit_helper_temp"
cat "$transit_work/collect-return-route.sh" >"$transit_collector_temp"
cat "$transit_work/service" >"$transit_service_temp"
{
  printf 'endpoint=%s\n' "$transit_endpoint"
  printf 'token=%s\n' "$transit_token"
  printf 'allow_insecure_http=0\n'
} >"$transit_config_temp"
unset transit_token
chown root:root "$transit_helper_temp" "$transit_collector_temp" "$transit_config_temp" "$transit_service_temp"
chmod 0755 "$transit_helper_temp" "$transit_collector_temp" "$transit_service_temp"
chmod 0600 "$transit_config_temp"
# Prepare every file before stopping an existing service, then replace atomically.
if [ -f "$TRANSIT_SERVICE" ] && rc-service transit-route-probe status >/dev/null 2>&1; then
  rc-service transit-route-probe stop
fi
mv -f -- "$transit_helper_temp" "$TRANSIT_INSTALL_DIR/helper.sh"
transit_helper_temp=
mv -f -- "$transit_collector_temp" "$TRANSIT_INSTALL_DIR/collect-return-route.sh"
transit_collector_temp=
mv -f -- "$transit_config_temp" "$TRANSIT_CONFIG"
transit_config_temp=
mv -f -- "$transit_service_temp" "$TRANSIT_SERVICE"
transit_service_temp=
rc-update add transit-route-probe default
rc-service transit-route-probe restart
sleep 2
rc-service transit-route-probe status || fail 'service status failed; read /var/log/transit-route-probe.log'
printf '\n%s\n' \
  'The helper service has started and is registered in the OpenRC default runlevel.' \
  'A running service does not yet confirm successful Agent authentication or route collection.' \
  'It polls automatically every 12-18 seconds; no cron entry is needed.' \
  'Request collection from your Komari panel after removing any pause on this node.' \
  'Restart: rc-service transit-route-probe restart' \
  'Status:  rc-service transit-route-probe status' \
  'Logs:    tail -n 80 /var/log/transit-route-probe.log'
