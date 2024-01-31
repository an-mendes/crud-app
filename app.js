const express = require('express');
const sqlite3 = require('sqlite3');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 3000;

const productsDB = new sqlite3.Database('products.db');


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views', 'pages'));

app.get('/', (req, res) => {
  res.render('landing');
});

app.get('/dashboard', (req, res) => {
  res.render('dashboard');
});




// GET endpoint
app.get('/products', async (req, res) => {
  try {
    const searchTerm = req.query.q || '';
    const sortOption = req.query.sort || 'name'; // Default sort : name

    const query = `SELECT * FROM products 
                   WHERE name LIKE ? 
                   ORDER BY ${sortOption}`;

    const searchTermWithWildcards = `%${searchTerm}%`;

    const products = await new Promise((resolve, reject) => {
      productsDB.all(query, [searchTermWithWildcards], (err, products) => {
        if (err) {
          reject(err);
        } else {
          resolve(products);
        }
      });
    });

    if (req.accepts('html')) {
      res.render('products', { products });
    } else {
      res.json({ products });
    }
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).send('Internal Server Error');
  }
});



app.post('/products', async (req, res) => {
  try {
    // Get data from form
    const { name, price, description, quantity } = req.body;

    // Insert into database
    const insertStatement = productsDB.prepare(
      'INSERT INTO products (name, price, description, quantity) VALUES (?, ?, ?, ?)'
    );
    insertStatement.run(name, price, description, quantity);
    insertStatement.finalize();

    res.redirect('/products');
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).send('Internal Server Error');
  }
});



app.delete('/products/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    console.log('Delete request received for product ID:', productId);

    // Delete in the database
    const deleteStatement = productsDB.prepare('DELETE FROM products WHERE id = ?');
    deleteStatement.run(productId);
    deleteStatement.finalize();

    res.sendStatus(200);
  } catch (err) {
    console.error('Error deleting product:', err.message);
    res.status(500).send('Internal Server Error');
  }
});


app.put('/products/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    const { name, price, description, quantity } = req.body;

    // Update the product in the database
    const query = `
      UPDATE products
      SET name = ?, price = ?, description = ?, quantity = ?
      WHERE id = ?`;

    await new Promise((resolve, reject) => {
      productsDB.run(
        query,
        [name, price, description, quantity, productId],
        (err) => (err ? reject(err) : resolve())
      );
    });

    res.json({ message: 'Product updated successfully' });
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
