# Images to COPY from:
FROM yamlio/yaml-play-sandbox-python:0.0.1 AS python


# Build the main image 'yaml-play-sandbox':
FROM yamlio/yaml-test-runtimes:0.1.1

# Copy over Python package installs:
COPY --from=python /export/ /

# Copy playground-sandbox control program:
COPY ./play-sandbox /bin/

ENTRYPOINT ["play-sandbox"]
