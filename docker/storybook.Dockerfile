FROM nginxinc/nginx-unprivileged:1.27-alpine@sha256:65e3e85dbaed8ba248841d9d58a899b6197106c23cb0ff1a132b7bfe0547e4c0
COPY docker/storybook.nginx.conf /etc/nginx/conf.d/default.conf
COPY packages/ui/storybook-static /usr/share/nginx/html
EXPOSE 8080
