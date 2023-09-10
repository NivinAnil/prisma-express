# Setup to run

- install a postgres in the system.
- Add `.env` file

```env
DATABASE_URL="postgresql://<userName>:<password@localhost:5432/<db-name>?schema=public"
JWT_SECRET="32 char secret for JWT"
JWT_EXPIRES_IN="1h"
SECRET="Secret for hashing password"
```

- install dependency
  
```sh
npm install
```

- run the server

```sh
run run dev  
```

Testing use `./rest` folder and vs code extension `rest client`
