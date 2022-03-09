const express = require('express')
const path = require('path')
const hbs = require('hbs')
const cookieParser = require('cookie-parser')
const { db } = require('./DB')
const { sessions } = require('./sessions')
const { checkAuth } = require('./src/middlewares/checkAuth')

const server = express()
const PORT = process.env.PORT || 3000

server.set('view engine', 'hbs')
process.env.PWD = process.cwd();
server.set('views', path.join(process.env.PWD, 'src', 'views'))
hbs.registerPartials(path.join(process.env.PWD, 'src', 'views', 'partials'))

server.use(express.urlencoded({ extended: true }))
server.use(cookieParser())



server.use((req, res, next) => {
  const sidFromUser = req.cookies.sid
  
  const currentSession = sessions[sidFromUser]
  
  if (currentSession) {
    const currentUser = db.users.find((user) => user.email === currentSession.email)
    console.log({ currentUser })
    res.locals.name = currentUser.name
  }
  
  next()
})

// *********************************************
server.get('/signout', (req, res) => {
  res.render('secret', {listOfContent: db.images})
  // listOfContent - имя передаваемого ключа, db.images - значение, а также имя массива в БД
})
server.post('/images', (req, res) => {
  const dataFromForm = req.body
  // Добавление и отображение данных:
  db.images.push(dataFromForm)
  res.redirect('/signout') // укажим страницу для вывода добавленого контента
})
// *********************************************

server.get('/', (req, res) => {
  res.render('main')
})

server.get('/secret', checkAuth, (req, res) => {
  res.render('secret')
})

server.get('/auth/signup', (req, res) => {
  res.render('signUp')
})

server.post('/auth/signup', (req, res) => {
  const { name, email, password } = req.body
  
  db.users.push({
    name,
    email,
    password,
  })
  
  const sid = Date.now()
  
  sessions[sid] = {
    email,
  }
  
  res.cookie('sid', sid, {
    httpOnly: true,
    maxAge: 36e8,
  })

  res.redirect('/')
})

server.get('/auth/signin', (req, res) => {
  res.render('signIn')
})

server.post('/auth/signin', (req, res) => {
  const { email, password } = req.body
  
  const currentUser = db.users.find((user) => user.email === email)
  
  if (currentUser) {
    if (currentUser.password === password) {
      const sid = Date.now()
      
      sessions[sid] = {
        email,
      }
      
      res.cookie('sid', sid, {
        httpOnly: true,
        maxAge: 36e8,
      })
      
      return res.redirect('/')
    }
  }
  
  return res.redirect('/auth/signin')
})

server.get('/auth/signout', (req, res) => {
  const sidFromUserCookie = req.cookies.sid
  
  delete sessions[sidFromUserCookie]
  
  res.clearCookie('sid')
  res.redirect('/')
})


server.listen(PORT, () => {
  console.log(`OK: ${PORT}`)
})
