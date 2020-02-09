import React from 'react';
import axios from 'axios';
import "bootstrap/dist/css/bootstrap.min.css";
import Alert from 'react-bootstrap/Alert'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import ButtonToolbar from 'react-bootstrap/ButtonToolbar'
import _ from 'lodash';
/**
 * note: make axios process cross origin
 */
axios.interceptors.response.use(function (response) {
  return response.data;//extract data
}, function (error) {
  return Promise.reject(error);
})

const joinPath = (...paths) => paths.map(it=> it.replace(/^\/|\/$/g, '')).join('/')

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      base_url: 'https://api.leapos.ca/',
      consumer_key: '7852a3e550554bc581697684b03c8d26',
      username: '644cf9d75a8eda4a1e9ab3a',
      password: 'f125d83b1747a3S+',
      token: '',
      customers: [],
      accounts: [],
      error: null,
      bank_id: '644cf9d75a8eda4a1e9ab3ac37a7000',
      sortedAmount:[],
      currentAccountId:'',
    }
    this.setAccount.bind(this,true);
  }

  base_url_onchange = e => {
    e.preventDefault();
    this.setState({"base_url": e.target.value})
  }
  consumer_key_onchange = e => {
    e.preventDefault();
    this.setState({"consumer_key": e.target.value})
  }
  username_onchange = e => {
    e.preventDefault();
    this.setState({"username": e.target.value})
  }
  password_onchange = e => {
    e.preventDefault();
    this.setState({"password": e.target.value})
  }
  error_handler = e => {
    if (e.response && e.response.data && e.response.data.message) {
      this.setState({'error': e.response.data.message})
    } else if (e.response && e.response.status && e.response.statusText) {
      const {status, statusText} = e.response
      this.setState({'error': JSON.stringify({status, "message": statusText})})
    } else if(e.response) {
      this.setState({'error': JSON.stringify(e.response)})
    } else if(e) {
      this.setState({'error': JSON.stringify(e)})
    }
  }

  fetch_direct_login_token = ()=>{
    const {base_url, consumer_key, username, password} = this.state
    const url =  joinPath(base_url, '/my/logins/direct')

    axios({
      url,
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
      mode: 'cors', // no-cors, *cors, same-origin
      cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `DirectLogin username="${username}",password="${password}",consumer_key="${consumer_key}"`
      }
    }).then(result => {
      this.setState({'token': result.token, 'error': null});
    }).catch(this.error_handler)
  }

  clear_token = ()=> this.setState({'token': ''})

  fetch_customers = ()=> {
    const {base_url, token} = this.state
    const url = joinPath(base_url, '/obp/v4.0.0/users/current/customers')
    axios({
      url,
      method: 'GET', // *GET, POST, PUT, DELETE, etc.
      mode: 'cors', // no-cors, *cors, same-origin
      cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `DirectLogin token="${token}"`
      }
    }).then(result => {
      console.log(result);
      this.setState({'customers': result.customers, 'error': null});
    }).catch(this.error_handler)
  }

  fetch_accounts = () => {
    const {base_url, token, bank_id} = this.state
    axios({
      url: joinPath(base_url, `/obp/v4.0.0/my/accounts`),
      method: 'GET', // *GET, POST, PUT, DELETE, etc.
      mode: 'cors', // no-cors, *cors, same-origin
      cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `DirectLogin token="${token}"`
      }
    }).then(result => {
      this.setState({
        'accounts': result.accounts,
        'error': null
      });
    }).catch(this.error_handler)
  }




  fetch_transactions = () => {
    console.log("Fetching transactions...");

    // Stolen from fetch_accounts
    const {base_url, token, bank_id} = this.state
    axios({
      url: joinPath(base_url, `obp/v4.0.0/banks/644cf9d75a8eda4a1e9ab3ac37a7000/accounts/942525966868-5eae007c-401/owner/transactions`),
      method: 'GET', // *GET, POST, PUT, DELETE, etc.
      mode: 'cors', // no-cors, *cors, same-origin
      cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `DirectLogin token="${token}"`
      }
    }).then(result => {
      this.setState({
        'transactions': result,
        'error': null
      });
      
      console.log(result);
      this.categoryTransactions(result.transactions);

    }).catch(this.error_handler)

  }

  categoryTransactions = (transactions) =>{
      const details =[];
      _.forEach(transactions,(transaction)=>{
        const temp = {};
        temp.type = transaction.details.type;
        temp.amount = transaction.details.value.amount;
        details.push(temp);

      })
      
       const groupType = _.groupBy(details, 'type');
       const cloneType = _.clone(groupType);
      _.forEach(groupType,(key, value)=>{

         let total = 0;
         _.forEach(key,(val)=>{
          total = total + Number.parseFloat(val.amount);
         });
         cloneType[value] = total.toFixed(2);
      });
      this.setState({'sortedAmount': Object.entries(cloneType)});
      console.log(Object.entries(cloneType));
       return cloneType;
  }
setAccount = (e)=>{

   const {base_url, token, bank_id} = this.state
   axios({
     url: joinPath(base_url, `obp/v4.0.0/banks/${bank_id}/accounts/${e.target.id}/owner/transactions`),
     method: 'GET', // *GET, POST, PUT, DELETE, etc.
     mode: 'cors', // no-cors, *cors, same-origin
     cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
     headers: {
       'Content-Type': 'application/json',
       'Authorization': `DirectLogin token="${token}"`
     }
   }).then(result => {
     this.setState({
       'transactions': result,
       'error': null
     });
     
     console.log(result);
     this.categoryTransactions(result.transactions);

   }).catch(this.error_handler)

}
getAccountRender(account){
  return (<li className="list-group-item" key={account.id} ><div onClick={this.setAccount} id={account.id}>{account.label} - account id: {account.id}</div></li>)
}

  render() {
    return (
        <div className="container">
        <div className="page-header text-center">
        <h1>LeapOS API SDK ReactJs</h1>
    <p>
    This is a demo of direct login, fetch accounts, customers
    </p>
    </div> <hr/>
    {
      this.state.token ?
    <div>
    <p>DirectLoginToken: <code>{this.state.token}</code><br/>
    All the follow http request will have the follow headers: <br/>

    <code style={{"whiteSpace":"pre-line"}}>
    {
      `
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': DirectLogin token="${this.state.token}"
                        }
                        `
    }
  </code>
    </p>
    <div className="mb-4">
        <ButtonToolbar>
        <Button variant="primary" onClick={this.clear_token}>Reset Token</Button>
    </ButtonToolbar>
    </div>
    <div className="mb-2">
        <Button variant="primary" onClick={this.fetch_accounts}>Get Accounts</Button> <br/>
    Accounts:
  <ul className="list-group">
        {
          this.state.accounts.length ?
              this.state.accounts.map(account => (this.getAccountRender(account))) :
              <li className="list-group-item">no accounts</li>
  }
  </ul>
    </div>
    <div className="mb-2">
        <ButtonToolbar>
        <Button variant="primary" onClick={this.fetch_customers}>Get Customers</Button> &nbsp;
    </ButtonToolbar>
    Customers:
        <ul className="list-group">
        {
          this.state.customers.length ?
              this.state.customers.map(customer => (<li className="list-group-item" key={customer.customer_id}>{customer.legal_name} - customer id: {customer.customer_id}</li>)) :
              <li className="list-group-item">no customers</li>
  }
  </ul>
    </div>


    <div className="mb-2">
        <Button variant="primary" onClick={this.fetch_transactions}>Get Transactions</Button> <br/>
    </div>

    <div>
    Transaction amount total by types:
    <br></br>
        <ul className="list-group">
        {
          this.state.sortedAmount.length ?
              _.forEach(this.state.sortedAmount, (value) => (<li className="list-group-item" key={value.key}>{value} <br></br></li>)) :
              <li className="list-group-item">no transactions</li>
  }
  </ul>
    </div>




    </div>
  :
  <Form autoComplete="on">
        <Form.Group controlId="formGroupApiUrl">
        <Form.Label>LeapOS api base url:</Form.Label>
    <Form.Control type="url" placeholder="Enter LeapOS api base url" required="required" value={this.state.base_url} onChange={this.base_url_onchange} />
    </Form.Group>
    <Form.Group controlId="formGroupConsumerKey">
        <Form.Label>Consumer key</Form.Label>
    <Form.Control type="text" placeholder="Enter Consumer key" required="required" value={this.state.consumer_key} onChange={this.consumer_key_onchange}/>
    </Form.Group>
    <Form.Group controlId="formGroupUsername">
        <Form.Label>User name</Form.Label>
    <Form.Control type="text" placeholder="Enter User name" required="required" value={this.state.username} onChange={this.username_onchange}/>
    </Form.Group>
    <Form.Group controlId="formGroupPassword">
        <Form.Label>Password</Form.Label>
        <Form.Control type="password" placeholder="Password" required="required" value={this.state.password} onChange={this.password_onchange}/>
    </Form.Group>
    <Button variant="primary" onClick={this.fetch_direct_login_token} >Get Token</Button>
    </Form>
  }
    {
      this.state.error ? <Alert variant='danger'> {this.state.error} </Alert> : ''
    }
  </div>
  );
  }
}

export default App;
