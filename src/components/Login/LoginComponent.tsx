import type { React, FC} from 'react';
import { login } from '../../pages/login/login';

const LoginComponent: FC<{onLogin:any}> = (props) => {
    const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        login(e.target[0].value).then((result) => {
            
        }).catch((err) => {
            
        });;
    }

    return (
        <div className='h-screen flex bg-gray-bg1'>
            <div className='w-full max-w-md m-auto bg-white rounded-lg border border-primaryBorder shadow-default py-10 px-16'>
                <h3 className='text-2xl font-medium text-primary mt-4 mb-12 text-center'>
                    Please enter the password to access the photos area
                </h3>

                <form onSubmit={handleFormSubmit}>
                    <div>
                        <label htmlFor='password'>Password</label>
                        <input
                            type='password'
                            className={`w-full p-2 text-primary border rounded-md outline-none text-sm transition duration-150 ease-in-out mb-4`}
                            id='password'
                            placeholder='Your Password'
                        />
                    </div>

                    <div className='flex justify-center items-center mt-6'>
                        <button
                            className={`py-2 px-4 text-sm text-primary rounded border border-green focus:outline-none focus:border-green-dark`}
                        >
                            Login
                        </button>
                    </div>
                </form>

                <div className='flex justify-center items-center mt-6'>
                    <p>If you have any issues logging in. Please get in touch via: 
                        <a>
                        </a></p>
                    </div>
            </div>
        </div>
    );
}

export default LoginComponent;