import './App.css';
// import GoogleBtn from './GoogleBtn';
// import SignInWithGoogle from './SignInWithGoogle';
import SignInWithFacebook from './SignInWithFb';


function App() {

  // window.addEventListener("message", ({ data }) => {
  //   console.log(data);
  // });

  return (
    <div className="App">
      <SignInWithFacebook />
    </div>
  );
}

export default App;
