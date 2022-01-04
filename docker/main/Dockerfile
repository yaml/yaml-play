ARG RUNTIMES_VERSION

# Images to COPY from:
FROM yamlio/yaml-play-sandbox-python:0.0.1 AS python

# Build the main image 'yaml-play-sandbox':
FROM yamlio/yaml-test-runtimes:$RUNTIMES_VERSION
ARG SANDBOX_VERSION

RUN echo $SANDBOX_VERSION > /sandbox_version

RUN apk add openssl

RUN (while true; do echo; done | head > /tmp/blanks) \
 && openssl req \
        -x509 -newkey \
        rsa:4096 \
        -nodes \
        -out /cert.pem \
        -keyout /key.pem \
        -days 365 \
        < /tmp/blanks

# Workaround:
RUN ln -s \
        /usr/lib/libffi.so.8.1.0 \
        /usr/lib/libffi.so.7

# Copy over Python package installs:
COPY --from=python /export/ /

# Copy playground-sandbox control program:
COPY ./play-sandbox /bin/

ENTRYPOINT ["play-sandbox"]
