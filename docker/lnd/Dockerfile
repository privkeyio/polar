FROM --platform=$BUILDPLATFORM golang:1.25-bookworm AS builder

ARG LND_VERSION
ARG LND_COMMIT
ARG TARGETARCH

RUN git clone --depth 1 --branch v${LND_VERSION} https://github.com/paulscode/lightning-fork /src \
  && cd /src \
  && test "$(git rev-parse HEAD)" = "${LND_COMMIT}" \
  && GOOS=linux GOARCH=${TARGETARCH} make release-install \
  && mkdir /out \
  && find /go/bin -type f \( -name lnd -o -name lncli \) -exec cp {} /out/ \;

FROM debian:stable-slim

ARG LND_VERSION
ENV PATH=/opt/lnd:$PATH

RUN apt-get update -y \
  && apt-get install -y curl gosu wait-for-it \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

COPY --from=builder /out/ /opt/lnd/

RUN curl -SLO https://raw.githubusercontent.com/paulscode/lightning-fork/v${LND_VERSION}/contrib/lncli.bash-completion \
  && mkdir -p /etc/bash_completion.d \
  && mv lncli.bash-completion /etc/bash_completion.d/ \
  && curl -SLO https://raw.githubusercontent.com/scop/bash-completion/master/bash_completion \
  && mv bash_completion /usr/share/bash-completion/

COPY docker-entrypoint.sh /entrypoint.sh
COPY bashrc /home/lnd/.bashrc

RUN chmod a+x /entrypoint.sh

VOLUME ["/home/lnd/.lnd"]

EXPOSE 9735 8080 10000

ENTRYPOINT ["/entrypoint.sh"]

CMD ["lnd"]
