# PHP + Apache
FROM php:8.2-apache

# PHP 확장
RUN docker-php-ext-install mysqli pdo pdo_mysql && docker-php-ext-enable mysqli \
 && apt-get update && apt-get install -y \
    libfreetype6-dev libjpeg62-turbo-dev libpng-dev libwebp-dev \
 && docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
 && docker-php-ext-install gd gettext exif

# Apache 설정
RUN a2enmod rewrite
RUN echo "DirectoryIndex index.php index.html" >> /etc/apache2/apache2.conf

# 코드 복사 & 권한
WORKDIR /var/www/html
COPY . /var/www/html/
RUN chown -R www-data:www-data /var/www/html

# ── 핵심: 런타임에 Secret Files 복사하는 스타트 스크립트 ──
COPY docker-start.sh /usr/local/bin/docker-start.sh
RUN chmod +x /usr/local/bin/docker-start.sh

# 컨테이너 시작시 실행
CMD ["/usr/local/bin/docker-start.sh"]
