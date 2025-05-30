const express = require('express')
const app = express()
const port = 7838
require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT
})

app.use(express.json())

app.post('/produtos', async (req, res)  => {
    const { nome, preco, categoria, image_url } = req.body

    if(!nome || !preco || !categoria || !image_url){
        return res.status(400).send('Todos os campos são obrigatórios')
    }

    if(nome.length > 100){
        return res.status(400).send('Nome pode ter no máximo 100 caracteres')
    }

    if(categoria.length > 50){
        return res.status(400).send('Categoria pode ter no máximo 50 caracteres')
    }
    try {
        const produto = await pool.query(`
        INSERT INTO produtos (nome, preco, categoria, image_url)
        VALUES ($1, $2, $3, $4)
        RETURNING *
    `, [nome, preco, categoria, image_url])

        res.status(201).send(produto.rows[0])
    } catch (error) {
        console.error(error)
        res.status(500).send('Erro ao cadastrar produto')
    }
})

app.get('/produtos', async (req, res) => {
    try {
        const produtos  = await pool.query('SELECT * FROM produtos')

        return res.status(200).send(produtos.rows)
    } catch (error) {
        console.error(error)
       
        return res.status(500).send('Erro ao buscar produtos')
    }
})
    
app.get('/produtos/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const produto = await pool.query(`
            SELECT * FROM produtos WHERE id = $1
            
        `, [id])

        if(!produto.rows.length){
            return res.status(404).send('Produto não encontrado')
        }
        
        return res.send(produto.rows[0])
    } catch (error) {
        console.error(error)
        return res.status(500).send('Erro ao buscar produto')
    }
})

app.delete('/produtos/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const produto = await pool.query(`
            SELECT * FROM produtos WHERE id = ${id}
        `)

        if(!produto.rows.length){
            return res.status(404).send('Produto não encontrado')
        }
        await pool.query(`
            DELETE FROM produtos WHERE id = $1
        `, [id])

        return res.status(202).send('Produto deletado com sucesso')
    } catch (error) {
        console.error(error)
        return res.status(500).send('Erro ao deletar produto')
    }
})

app.put('/produtos/:id', async (req, res) => {
    const { id } = req.params;
    const { nome, preco, categoria, image_url} = req.body;

    try {
        const produto = await pool.query(`
            SELECT * FROM produtos WHERE id = $1 
        `, [id])

        if(!produto.rows.length){
            return res.status(404).send('Produto não encontrado')
        }

        await pool.query(`
            UPDATE produtos SET
            nome = $1,
            preco = $2,
            categoria = $3,
            image_url = $4,
            WHERE id = $5
            RETURNING *
        `, [nome, preco, categoria, image_url, id])

        return res.send('Produto realizado com sucesso')
    } catch (error) {
        console.error(error)
        return res.status(500).send('Erro ao atualizar produto')
    }

})
app.listen(port, () => {
  console.log(`O servidor esta rodando na porta ${port}`)
})