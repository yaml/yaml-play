ARG RUNTIMES_VERSION

# Images to COPY from:
FROM yamlio/yaml-play-sandbox-python:0.0.3 AS python

# Build the main image 'yaml-play-sandbox':
FROM yamlio/yaml-test-runtimes:$RUNTIMES_VERSION
ARG SANDBOX_VERSION

RUN echo $SANDBOX_VERSION > /sandbox_version

# Workaround:
RUN ln -s \
        /usr/lib/libffi.so.8.1.0 \
        /usr/lib/libffi.so.7

# Copy over Python package installs:
COPY --from=python /export/ /

# Copy playground-sandbox control program:
COPY ./play-sandbox /bin/

# Generate self-signed SSL certificates for HTTPS
RUN apk add --no-cache openssl && \
    openssl req -x509 -newkey rsa:4096 -nodes \
    -keyout /key.pem -out /cert.pem -days 365 \
    -subj '/CN=localhost'

ENTRYPOINT ["play-sandbox"]
