FROM nginxinc/nginx-unprivileged:1.31-alpine@sha256:2ddec616f1cb58bcac057aa388f28cb81e35137641ef4226d321714499329bd1
COPY docker/storybook.nginx.conf /etc/nginx/conf.d/default.conf
COPY packages/ui/storybook-static /usr/share/nginx/html
EXPOSE 8080
