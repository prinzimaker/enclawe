# ------------------------------------------------------------
# EnclaWe 1.0   Rel 251212
# December 2025
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
# Aldus Prinzimaker
# ------------------------------------------------------------
# File: client/Dockerfile
# Docker configuration for client static file server
# ------------------------------------------------------------

FROM nginx:alpine

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy static files
COPY index.html /usr/share/nginx/html/
COPY css/ /usr/share/nginx/html/css/
COPY js/ /usr/share/nginx/html/js/

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
