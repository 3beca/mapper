#!/bin/bash
set -e
echo Deploy image $IMAGE_NAME:$CI_TIMESTAMP
scp -r ./var/www/deploy/charts/** $USER_NAME@$HOST_NAME:./charts/tribeca-mapper/
ssh $USER_NAME@$HOST_NAME helm upgrade tribeca-mapper ./charts/tribeca-mapper \
    --set image=$IMAGE_NAME:$CI_TIMESTAMP \
    --set deployment.env.externalHttpHost=$EXTERNAL_HTTP_HOST \
    --install --wait

