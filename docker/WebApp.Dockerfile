FROM node:20-alpine AS frontend
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /home/node/app 
COPY ./code/app/frontend/package*.json ./  
USER node
RUN npm ci  
COPY --chown=node:node ./code/app/frontend ./frontend

# Frontend envs must be passed in as build-args
ARG FRONTEND_TEAM="default"
ARG GLB_LOGO_HEADER_URL
ARG GLB_LOGO_FOOTER_URL
ARG FAVICON_URL
RUN printf "\
\
VITE_TEAM='${FRONTEND_TEAM}'\n\
VITE_GLB_LOGO_HEADER_URL='${GLB_LOGO_HEADER_URL}'\n\
VITE_GLB_LOGO_FOOTER_URL='${GLB_LOGO_FOOTER_URL}'\n\
VITE_FAVICON_URL='${FAVICON_URL}'\n\
\
" > ./frontend/.env

WORKDIR /home/node/app/frontend
RUN npm run build


FROM python:3.9.7-alpine3.14
RUN apk add --no-cache --virtual .build-deps \
    build-base \
    libffi-dev \
    openssl-dev \
    curl \
    && apk add --no-cache \
    libpq \
    && pip install --no-cache-dir uwsgi
  
COPY ./code/app/requirements.txt /usr/src/app/
RUN pip install --no-cache-dir -r /usr/src/app/requirements.txt \
    && rm -rf /root/.cache
  
COPY ./code/app/app.py /usr/src/app/
COPY ./code/utilities /usr/src/app/utilities
COPY --from=frontend /home/node/app/static  /usr/src/app/static/
WORKDIR /usr/src/app
EXPOSE 80
CMD ["uwsgi", "--http", ":80", "--wsgi-file", "app.py", "--callable", "app", "-b","32768"]
