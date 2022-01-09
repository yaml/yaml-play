FROM alpine:latest

ENV BUMP 1

RUN apk update \
 && apk add \
        bash \
        build-base \
        cargo \
        curl \
        git \
        libffi \
        libffi-dev \
        m4 \
        musl-dev \
        openssl \
        openssl-dev \
        perl \
        perl-app-cpanminus \
        perl-dev \
        py3-pip \
        python3 \
        python3-dev \
        vim \
        wget \
 && true

RUN apk upgrade musl

SHELL ["/bin/bash", "-c"]

RUN ( \
        echo US; \
        echo DE; \
        echo Dover; \
        echo "YAML LLC"; \
        echo "Jan 8 2022"; \
        echo "YAML LLC"; \
        echo ingy@yaml.com \
    ) | \
    openssl req \
        -x509 -newkey \
        rsa:4096 \
        -nodes \
        -out /cert.pem \
        -keyout /key.pem \
        -days 365

RUN pip3 install wheel

RUN pip3 install \
        flask \
        flask-cors \
        pyopenssl \
        pyyaml \
 && true

RUN mkdir -p /export/usr/lib/python3.9/site-packages \
 && cp -Pr \
        /usr/lib/python3.9/site-packages/* \
        /export/usr/lib/python3.9/site-packages/ \
 && cp /cert.pem /key.pem /export/ \
 && true
