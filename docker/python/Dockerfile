FROM alpine:latest

RUN apk update \
 && apk add \
        bash \
        build-base \
        curl \
        git \
        libffi-dev \
        m4 \
        musl-dev \
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

RUN sed -i -e 's/v3\.14/v3.12/g' /etc/apk/repositories

RUN apk update

RUN apk add cargo=1.44.0-r0

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
 && true
