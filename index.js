import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  connectionString: process.env.DATABASE_URL,
 /* user : "postgres",
  host : "localhost",
  database : "world",
  password : "helloWORLD@123",
  port : 5432 */
});

db.connect();

app.use(bodyParser.urlencoded({extended : true }));
app.use(express.static("public"));

async function checkVisited()
{
  const result = await db.query("SELECT country_code FROM visited_countries");
  let visited= [];
  console.log(result.rows); //  .rows shows the row values instead of all bull shit values.
  result.rows.forEach(code => {
    visited.push(code.country_code);
  });
  console.log(visited); //visited is in array data type.
  return visited;
  
}

app.get("/", async (req,res) => {
  const countries = await checkVisited();
  res.render("index.ejs", {total: countries.length, countries: countries });
});

app.post("/add", async (req,res) => {
  const input = req.body ["country"];
  console.log(input); //shows the country input we got from the user at front end.

  let dataInput = input.toLowerCase();
  dataInput = dataInput.charAt(0).toUpperCase() + dataInput.slice(1);
  console.log(dataInput);

  const countries = await checkVisited(); //for error
  const total = countries.length;

  const result = await db.query("SELECT country_code FROM countries WHERE country_name = $1", [dataInput]);
  try{
    if(result.rows.length>0)
    {
      const matched = result.rows[0].country_code;
      console.log(matched); // this is the country_code we got from countries database after we matched the inputed country and the existing data of countries.

      await db.query("INSERT INTO visited_countries (country_code) VALUES ($1)",[matched]);
      res.redirect("/");
    }
    else
    {
      console.log("Error executing.");
      res.render("index.ejs",{error: "The Country name couldn't be found.", total: total, countries: countries});
    }
  }
  catch(err){
    if(err.code === '23505')
    {
      res.render("index.ejs",{error: "The country name is already added.",total: total, countries: countries});
    }
    else{
      console.log(err.stack);
      res.status(500).render("index.ejs",{error: "An unexpected server error occured.",total: total, countries: countries});
    }
  }  
});

app.listen(port,() => {
  console.log(`Server is running at http://localhost:${port}`);
});