# PHP + Apache 기반 이미지 사용
FROM php:8.2-apache

# PHP 확장 설치 (MySQL, PDO 등)
RUN docker-php-ext-install mysqli pdo pdo_mysql && docker-php-ext-enable mysqli

# GD 라이브러리 설치 (이미지 처리용)
RUN apt-get update && apt-get install -y \
    libfreetype6-dev \
    libjpeg62-turbo-dev \
    libpng-dev \
    libwebp-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install gd

# 기타 필요한 확장 설치
RUN docker-php-ext-install gettext exif

# Apache rewrite 모듈 활성화
RUN a2enmod rewrite

# 작업 디렉토리 설정
WORKDIR /var/www/html

# 프로젝트 파일 복사
COPY . /var/www/html/

# 디렉토리 권한 설정
RUN chown -R www-data:www-data /var/www/html

# index.php 우선 적용 설정
RUN echo "DirectoryIndex index.php index.html" >> /etc/apache2/apache2.conf

# Apache 실행 명령
CMD ["apache2-foreground"]
