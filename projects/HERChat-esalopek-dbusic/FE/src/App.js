import React from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";

//pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";

function App() {
  return (
    <Router>
      <Switch>
        <Route exact path="/">
          {<Login />}
        </Route>
        <Route path="/home">{<Home />}</Route>
        <Route path="/register">{<Register />}</Route>
        <Route path="/profile">{<Profile />}</Route>
      </Switch>
    </Router>
  );
}

export default App;
