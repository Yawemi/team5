#!/bin/bash
openssl ocsp \
  -index ../ca/index.txt \
  -port 2560 \
  -rsigner ../certs/ocsp_cert.pem \
  -rkey ../certs/ocsp_key.pem \
  -CA ../certs/ca_cert.pem \
  -text &
