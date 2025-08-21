# FROM node:18-alpine
FROM mcr.microsoft.com/vscode/devcontainers/javascript-node:dev-22-bookworm

ENV DEBIAN_FRONTEND=noninteractive

# [Optional] Uncomment this section to install additional OS packages.
# RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
#     && apt-get -y install --no-install-recommends <your-package-list-here>

# [Optional] Uncomment if you want to install an additional version of node using nvm
# ARG EXTRA_NODE_VERSION=10
# RUN su node -c "source /usr/local/share/nvm/nvm.sh && nvm install ${EXTRA_NODE_VERSION}"

#alpine

# RUN sudo apk add --allow-untrusted mssql-tools18_18.1.1.1-1_amd64.apk

# ------------------------------------------------------------
#  Install Bun as the current (non-root) user
# ------------------------------------------------------------
# --- Install Bun as the current (non-root) user ---
RUN curl -fsSL https://bun.sh/install | bash
RUN "$HOME/.bun/bin/bun" --version

# --- Make Bun globally available (so any shell/user can run `bun`) ---
RUN cp "$HOME/.bun/bin/bun" /usr/local/bin/bun \
 && chmod 0755 /usr/local/bin/bun \
 && bun --version

# ------------------------------------------------------------
#  Install Deno (optimized, fewer apt-get update calls)
# ------------------------------------------------------------
RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends ca-certificates curl unzip; \
    rm -rf /var/lib/apt/lists/*; \
    curl -fsSL https://deno.land/x/install/install.sh | sh -s -- -y --no-modify-path; \
    install -m 0755 /root/.deno/bin/deno /usr/local/bin/deno; \
    deno --version

# ------------------------------------------------------------
#  MS SQL ODBC (your original install kept unchanged)
# ------------------------------------------------------------
RUN sudo cp "$HOME/.bun/bin/bun" /usr/local/bin/bun
RUN sudo chmod 0755 /usr/local/bin/bun
RUN bun --version

#debian
RUN curl https://packages.microsoft.com/keys/microsoft.asc | apt-key add -
RUN curl https://packages.microsoft.com/config/debian/11/prod.list > /etc/apt/sources.list.d/mssql-release.list
RUN apt-get update
RUN ACCEPT_EULA=Y apt-get install -y msodbcsql18
#RUN echo 'export PATH="$PATH:/opt/mssql-tools18/bin"' >> ~/.bashrc
#RUN ~/.bashrc
RUN apt-get install -y unixodbc-dev

# ------------------------------------------------------------
#  Alpine variant (kept commented for reference)
# ------------------------------------------------------------
# RUN apk update
# RUN apk --no-cache add curl
# RUN apk --no-cache add unixodbc
# RUN apk add sudo
# # - RUN apk add unzip
# RUN curl -O https://download.microsoft.com/download/b/9/f/b9f3cce4-3925-46d4-9f46-da08869c6486/msodbcsql18_18.1.1.1-1_amd64.apk
# RUN curl -O https://download.microsoft.com/download/b/9/f/b9f3cce4-3925-46d4-9f46-da08869c6486/mssql-tools18_18.1.1.1-1_amd64.apk
# RUN apk add --allow-untrusted msodbcsql18_18.1.1.1-1_amd64.apk
# RUN apk add --allow-untrusted mssql-tools18_18.1.1.1-1_amd64.apk
# RUN apk add libnsl
# RUN apk add gcompat
# RUN ln -s /usr/lib/libnsl.so.3 /usr/lib/libnsl.so.1

# ------------------------------------------------------------
#  Example for bundling configuration scripts
# ------------------------------------------------------------
# RUN mkdir -p /usr/config
# WORKDIR /usr/config
# COPY . /usr/config
# USER root
# RUN chmod +x /usr/config/configure-db.sh
# RUN chmod +x /usr/config/configure-db-local.sh
# ENTRYPOINT ["./configure-db-local.sh"]
