import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Jumbotron } from 'react-bootstrap';
import { Footer, Navigation, Home, Generate } from './components';
import styles from './App.module.scss';

class App extends React.Component {
  render() {
    return (
      <>
        <Navigation />
        <Jumbotron align="center" className={styles.contentMobile}>
          <h1 className="display-4">Generate Certificates</h1>
          <p className="lead">
            This is the certificate generation site for Indian Institute of
            Information Technology, Vadodara.
          </p>
          <p className="lead">You need to be on a computer to use this generator.</p>
        </Jumbotron>
        <div className={styles.contentDesktop}>
          <Router>
            <Switch>
              <Route path="/" exact component={() => <Home />} />
              <Route path="/generate" exact component={() => <Generate />} />
            </Switch>
          </Router>
        </div>
        <Footer />
      </>
    );
  }
}

export default App;
