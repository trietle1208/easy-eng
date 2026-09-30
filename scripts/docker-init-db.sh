#!/bin/sh
# Creates the Vitest database alongside the app database (first volume init only).
set -eu
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
  CREATE DATABASE easy_english_test;
EOSQL
