const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const Todo = require('./models/todo');
const User = require('./models/user');
const Session = require('./models/session')

const url = 'mongodb://ben:test1234@ds019826.mlab.com:19826/junior-assessment';

// app config
const app = express();
const PORT = 3000;
app.use('/public', express.static(path.join(__dirname, 'public')));

// body parser
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());
app.use(cookieParser());

// db connection
mongoose.connect(url, () => {
  console.log('You are connected to the DB...');
});

// home 
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/index.html'));
});

app.get('/todolist', (req, res) => {
  const cookie = req.cookies.ssid;
  if (cookie) {
    Session.findOne({'cookieId': cookie}, (err, cookieFound) => {
      if (cookieFound) {
        res.sendFile(path.join(__dirname, '/todolist.html'));
      } else {
        res.redirect('/')
      }
    })
  } else {
    res.redirect('/')
  }
});

//SIGNUP
app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, '/signup.html'));
})

app.post('/signup', (req, res) => {
  const { username, password } = req.body;
  User.create({username, password}, (err, user) => {
    if (err) res.status(500).json(err);
    Session.create({cookieId: user._id}, (err, session) =>  {
      if (err) throw err;
      console.log(session);
    });
    res.cookie('ssid', user._id, { maxAge: 900000, httpOnly: true });
    res.redirect('/')
  });
})

//LOGIN
app.post('/login', (req, res) => {
  //check if there's a cookie
  const cookie = req.cookies.ssid;
  if (cookie) {
    Session.findOne({'cookieId': cookie}, (err, cookieFound) => {
      console.log('i had a cookie already')
      if (cookieFound) {
        res.sendFile(path.join(__dirname, '/todolist.html'));
      }
    })
  } else {
  // otherwise check credentials
    console.log('i did not have a cookie')
    const { username } = req.body;
    User.findOne({'username': username}, (err, user) => {
      if (user) {
          Session.findOne({'cookieId': user._id}, (err, sessionFound) => {
            if (sessionFound) {
              console.log('i had a session already')
              res.sendFile(path.join(__dirname, '/todolist.html'));
            } else {
              // create a session
              Session.create({cookieId: user._id}, (err, session) =>  {
                if (err) throw err;
              });
              res.cookie('ssid', user._id, { maxAge: 900000, httpOnly: true });
              res.redirect('/todolist');
            }
          })
      } else {
        res.send('user does not exist');
      }
    });
  }
});

app.get('/getallusers', (req, res) => {
  User.find({}, (err, data) => {
    res.json(data);
  });
});

app.get('/deleteallusers', (req, res) => {
  User.deleteMany({}, (err, data) => {
    res.json(data);
  })
})

app.get('/getallsessions', (req, res) => {
  Session.find({}, (err, data) => {
    res.json(data);
  })
});

app.get('/deleteallsessions', (req, res) => {
  Session.remove({}, (err, data) => {
    res.json(data);
  })
})



// add todo
app.post('/todo', (req, res) => {
  const newTodo = req.body;
  Todo.create(newTodo, (err, newlyCreated) => {
    if (err) {
      console.log(err, '<--- error from add todo');
      res.status(500).json(err);
    } else {
      res.json(newlyCreated);
    }
  });
});

// get all todos
app.get('/todo', (req, res) => {
  Todo.find({}, (err, allTodos) => {
    if (err) res.status(500).json(err);
    res.json(allTodos);
  });
});

// delete a todo
app.delete('/todo/:id', (req, res) => {
  const deleted = { _id: req.params.id };
  Todo.findByIdAndRemove(deleted, (err, response) => {
    if (err) res.status(500).json(err);
    res.json(response);
  });
});

// update one todo

app.patch('/todo/:id', (req, res) => {
  const update = {
    todo: req.body.todo,
    date: Date.now(),
  };

  Todo.findByIdAndUpdate({ _id: req.params.id }, update, (err, response) => {
    if (err) {
      res.status(500).json(err);
    } else {
      res.json(response);
    }
  });
});

app.listen(PORT, () => console.log(`I am running on ${PORT} ........💩`));
