#!/bin/bash
set -e
# Grant the app user full privileges on the Django test database.
# Django's test runner creates test_<MYSQL_DATABASE> but needs the app user
# to have CREATE DATABASE and all privileges on it, not just the root account.
mysql -u root -p"${MYSQL_ROOT_PASSWORD}" <<-EOSQL
    CREATE DATABASE IF NOT EXISTS \`test_${MYSQL_DATABASE}\`;
    GRANT ALL PRIVILEGES ON \`test_${MYSQL_DATABASE}\`.* TO '${MYSQL_USER}'@'%';
    FLUSH PRIVILEGES;
EOSQL
