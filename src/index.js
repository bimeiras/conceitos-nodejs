const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  const foundUser = users.find(user => user.username === username);

  if (!foundUser) {
    return response.status(404).json({error: 'User not found!'})
  }

  request.user = foundUser;

  return next()

}

function checksExistsTodo(request, response, next) {
  const { id } = request.params;
  const { user } = request;
  
  const foundTodo = user.todos.some(todo => todo.id === id)

  if (!foundTodo) {
    return response.status(404).json({error: "Todo not found!"})
  }

  const todoIndex = user.todos.findIndex(todo => todo.id === id);

  request.todoIndex = todoIndex

  return next()
}

app.post('/users', (request, response) => {
  const { name, username } = request.body;

  const checkIfUsernameAlreadyExists = users.some(user => user.username === username)

  if (checkIfUsernameAlreadyExists) {
    return response.status(400).json({error: "Username already exists!"})
  }

  const user = {
    id: uuidv4(),
    name,
    username,
    todos: []
  };

  users.push(user);

  return response.status(201).json(user)
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;
  return response.json(user.todos)
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { title, deadline } = request.body;

  const todo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date(),
  }

  user.todos.push(todo);

  return response.status(201).json(todo)
});

app.put('/todos/:id', checksExistsUserAccount, checksExistsTodo, (request, response) => {
  const { user, todoIndex } = request;

  const { title, deadline } = request.body;

  user.todos[todoIndex].title = title;
  user.todos[todoIndex].deadline = new Date(deadline);

  return response.status(201).send()

});

app.patch('/todos/:id/done', checksExistsUserAccount, checksExistsTodo, (request, response) => {
  const { user, todoIndex } = request;
  user.todos[todoIndex].done = true

  return response.status(201).send()
});

app.delete('/todos/:id', checksExistsUserAccount, checksExistsTodo, (request, response) => {
  const { user, todoIndex } = request;
  user.todos.splice(todoIndex, 1);

  return response.status(204).send()
});

module.exports = app;