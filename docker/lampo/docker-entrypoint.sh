#!/bin/sh
set -e

# containers on linux share file permissions with hosts.
# assigning the same uid/gid from the host user
# ensures that the files can be read/write from both sides
if ! id lampo > /dev/null 2>&1; then
  USERID=${USERID:-1000}
  GROUPID=${GROUPID:-1000}

  echo "adding user lampo ($USERID:$GROUPID)"
  groupadd -f -g $GROUPID lampo
  useradd -r -u $USERID -g $GROUPID lampo
  chown -R $USERID:$GROUPID /home/lampo
fi

if [ $(echo "$1" | cut -c1) = "-" ]; then
  echo "$0: assuming arguments for lampod-cli"

  set -- lampod-cli "$@"
fi

LAMPO_DIR=/home/lampo/.lampo/regtest
mkdir -p $LAMPO_DIR
cat > $LAMPO_DIR/lampo.conf <<CONF
network=regtest
port=9735
bind-addr=0.0.0.0
alias=$(hostname)
backend=core
dev-sync=true
CONF
chown -R "$(id -u lampo):$(id -g lampo)" /home/lampo/.lampo

if [ "$1" = "lampod-cli" ] && [ ! -f $LAMPO_DIR/wallet.dat ]; then
  # an interrupted wallet creation leaves a database without its seed,
  # which a new wallet cannot be created over
  rm -f $LAMPO_DIR/bdk-wallet.db
  for arg in "$@"; do
    case "$arg" in
      --core-url=*) CORE_URL="${arg#--core-url=}" ;;
    esac
  done
  if [ -n "$CORE_URL" ]; then
    echo "Waiting for $CORE_URL"
    until curl -s -o /dev/null "$CORE_URL"; do sleep 1; done
  fi
  echo "Creating the lampo wallet"
  gosu lampo "$@" new-wallet
fi

if [ "$1" = "lampod-cli" ] || [ "$1" = "lampo-cli" ]; then
  echo "Running as lampo user: $@"
  exec gosu lampo "$@"
fi

echo "$@"
exec "$@"
