# Email Assistant

This is a simple email assistant application that reads incoming emails, processes them using the OpenAI GPT-3.5 API, and sends responses. It uses Node.js, IMAP for reading emails, Nodemailer for sending emails, and the OpenAI API for natural language processing.

## Prerequisites

- Node.js v14.20.0 or later
- A Gmail account with "Allow less secure apps" enabled or an App Password generated
- OpenAI API Key (You will be provided with the necessary information)

## Gmail Account Setup

To use this application with your Gmail account, you need to enable "Allow less secure apps" or generate an App Password. Follow the steps below:

### Option 1: Allow Less Secure Apps

1. Sign in to your Google Account.
2. Go to the [Less secure apps](https://myaccount.google.com/lesssecureapps) page.
3. Turn on "Allow less secure apps."

### Option 2: Generate an App Password (recommended)

1. Sign in to your Google Account.
2. Go to the [App passwords](https://myaccount.google.com/apppasswords) page.
3. Select "Mail" as the app and "Other (Custom name)" as the device.
4. Enter a custom name (e.g., "Email Assistant") and click "Generate."
5. Copy the generated 16-character App Password and use it as the `PASSWORD` in your `.env` file.

**Important:** Do not share your App Password or use it for any other purpose.

## OpenAI API Key

To obtain your OpenAI API Key, follow these steps:

1. Go to the [OpenAI API Keys](https://platform.openai.com/account/api-keys) page.
2. Sign in with your OpenAI account or create one if you don't have it already.
3. After signing in, you will see a list of your API keys. If you don't have any API keys yet, click the "Create" button to generate one.
4. Copy the secret API key (it starts with `sk-`) and paste it into the `OPENAI_API_KEY` variable in your `.env` file.

**Important:** Do not share your API key with others or expose it in the browser or other client-side code. In order to protect the security of your account, OpenAI may automatically rotate any API key that they've found has leaked publicly.

## Setup

1. Clone this repository and navigate to the project directory:

```bash
git clone https://github.com/tgeant/gmail-chatgpt-assistant.git
cd gmail-chatgpt-assistant
```

2. Install the required dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory of the project and add the necessary environment variables:

```
EMAIL=myemail@gmail.com
PASSWORD=my_password
OPENAI_API_KEY=my_api_key
SYSTEM_PROMPT=You are a helpful assistant.
```

Replace `myemail@gmail.com` with your Gmail address, `my_password` with your Gmail password or App Password, and `my_api_key` with your OpenAI API key. The `SYSTEM_PROMPT` variable contains the system message used to set the context for the GPT-3.5 API.

## Running the Application

You can run the application using either `npm` or `Docker`.

### Using npm

To start the application using npm, run the following command:

```bash
npm start
```

### Using Docker

1. Build the Docker image:

```bash
docker build -t email-assistant .
```

2. Run the Docker container:

```bash
docker run -d --name email-assistant --env-file .env -v $(pwd):/app email-assistant sh -c "npm install && npm start"
```

This will run the container in the background, use the environment variables from the `.env` file, and mount the current directory to the container's working directory.

### Using Docker Compose

1. Make sure the `docker-compose.yml` file is in the project root.

2. Run the Docker Compose:

```bash
docker-compose up -d
```

This will run the container in the background using the configuration from the `docker-compose.yml` file.

## License

This project is licensed under the MIT License.