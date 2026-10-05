FROM ubuntu:24.04

ARG CLN_VERSION
ARG BITCOIN_VERSION

RUN userdel -r ubuntu \
  && apt-get update -y \
  && apt-get install -y curl gosu git xz-utils libsqlite3-0 libpq5 libsodium23 zlib1g \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN SYS_ARCH="$(dpkg --print-architecture)" \
  && curl -SLO https://github.com/privkeyio/lightning/releases/download/v${CLN_VERSION}/clightning-v${CLN_VERSION}-Ubuntu-24.04-${SYS_ARCH}.tar.xz \
  && curl -SLO https://github.com/privkeyio/lightning/releases/download/v${CLN_VERSION}/SHA256SUMS-v${CLN_VERSION} \
  && sha256sum --ignore-missing -c SHA256SUMS-v${CLN_VERSION} \
  && tar -xJf clightning-*.tar.xz -C / \
  && rm clightning-*.tar.xz SHA256SUMS-*

RUN SYS_ARCH="$(uname -m)" \
  && curl -SLO https://github.com/bitcoinknots/bitcoin/releases/download/v${BITCOIN_VERSION}/bitcoin-${BITCOIN_VERSION}-${SYS_ARCH}-linux-gnu.tar.gz \
  && curl -SLO https://github.com/bitcoinknots/bitcoin/releases/download/v${BITCOIN_VERSION}/SHA256SUMS \
  && sha256sum --ignore-missing -c SHA256SUMS \
  && tar -xzf *.tar.gz \
  && install -m 755 bitcoin-${BITCOIN_VERSION}/bin/bitcoin-cli /usr/bin/bitcoin-cli \
  && rm -rf bitcoin-* SHA256SUMS

# download CLN bash completion file
RUN curl -SLO https://raw.githubusercontent.com/privkeyio/lightning/v${CLN_VERSION}/contrib/lightning-cli.bash-completion \
  && mkdir -p /etc/bash_completion.d \
  && mv lightning-cli.bash-completion /etc/bash_completion.d/lightning-cli

# install lightning-cli bash completion
RUN curl -SLO https://raw.githubusercontent.com/scop/bash-completion/master/bash_completion \
  && mkdir -p /usr/share/bash-completion \
  && mv bash_completion /usr/share/bash-completion/

COPY docker-entrypoint.sh /entrypoint.sh
COPY bashrc /home/clightning/.bashrc

RUN chmod a+x /entrypoint.sh

VOLUME ["/home/clightning"]

EXPOSE 9735 9835 8080 10000

ENTRYPOINT ["/entrypoint.sh"]

CMD ["lightningd"]
