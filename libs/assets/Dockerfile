# MinIO stopped distributing mc images (Docker Hub removed, quay.io now 401,
# dl.min.io 410). Chainguard's build is maintained; the -dev variant ships the
# shell entrypoint.sh needs.
FROM cgr.dev/chainguard/minio-client:latest-dev

COPY libs/assets/static/ /static/
COPY libs/assets/entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
