var mysql = require('mysql');

var connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '1234',
  database: 'test_db'
});

function login(username, password) {
  var query =
    "SELECT * FROM users WHERE username = '" +
    username +
    "' AND password = '" +
    password +
    "'";

  console.log("Ejecutando query:", query);

  connection.query(query, function (err, results) {
    if (err) throw err;

    if (results.length > 0) {
      console.log("Login exitoso");
    } else {
      console.log("Credenciales inválidas");
    }
  });
}

login("admin' OR '1'='1", "cualquiercosa");
