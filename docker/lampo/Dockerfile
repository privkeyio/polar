FROM rust:1-bookworm AS builder

ARG LAMPO_VERSION
ARG LAMPO_COMMIT

RUN git clone --depth 1 --branch v${LAMPO_VERSION} https://github.com/privkeyio/lampo.rs /src \
  && cd /src \
  && test "$(git rev-parse HEAD)" = "${LAMPO_COMMIT}" \
  && cargo build --release --locked -p lampod-cli -p lampo-cli \
  && cargo build --release --locked -p lampo-plugin-sdk --example lampo-bitcoind \
  && mkdir /out \
  && cp target/release/lampod-cli target/release/lampo-cli target/release/examples/lampo-bitcoind /out/

FROM debian:bookworm-slim

ENV PATH=/opt/lampo:$PATH

RUN apt-get update -y \
  && apt-get install -y ca-certificates curl gosu bash \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

COPY --from=builder /out/ /opt/lampo/

COPY docker-entrypoint.sh /entrypoint.sh

RUN chmod a+x /entrypoint.sh

VOLUME ["/home/lampo/.lampo"]

EXPOSE 9735 7979

ENTRYPOINT ["/entrypoint.sh"]

CMD ["lampod-cli"]
