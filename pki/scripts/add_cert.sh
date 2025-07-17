#!/bin/bash
echo "Укажите путь к сертификату:"
read cert_path
serial=$(openssl x509 -in $cert_path -noout -serial | cut -d= -f2)
subject=$(openssl x509 -in $cert_path -noout -subject | sed 's/^subject=//')
echo -e "V\t$(date -u +'%y%m%d%H%M%SZ')\t\t$serial\tgood\t$subject" >> ../ca/index.txt
echo "Сертификат добавлен в базу!"
