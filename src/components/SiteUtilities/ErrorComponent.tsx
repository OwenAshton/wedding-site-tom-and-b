const errorStyles = {
    backgroundColor: 'red',
    color: 'white',
    padding: '10px',
    margin: '10px'
}


const ErrorComponent =({errorMessage}) => {
    return (
        <div style={errorStyles}>
            <h1>{errorMessage}</h1>
        </div>
    )
}

export default ErrorComponent;

