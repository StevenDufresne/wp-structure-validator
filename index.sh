
##zip theme.zip -r ./ -x '.*'
ls

# # Turn it on
npm run wp-env start

# Trigger the check
npm run wp-env run cli eval-file ./config/test.php
