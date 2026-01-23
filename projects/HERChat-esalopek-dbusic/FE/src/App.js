import React from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";

//pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";

function App() {
  return (
    <Router>
      <Switch>
        <Route exact path="/">
          {<Login />}
        </Route>
        <Route path="/home">{<Home />}</Route>
        <Route path="/register">{<Register />}</Route>
      </Switch>
    </Router>
  );
}

export default App;
