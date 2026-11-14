# SpaceAppChallenge

## Setup Requirements

### Mysql 

Setup  mysql database and create the project database and user astra_app@localhost and grant him the required priviledges as follows:

```mysql
CREATE DATABASE IF NOT EXISTS astra_db;

GRANT SELECT, INSERT, UPDATE, DELETE
ON astra_db.*
TO 'astra_app'@'localhost';
```

!NOTE: Make sure to update the .env variable for the server configuration accordingly.