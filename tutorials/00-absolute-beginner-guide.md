# Absolute Beginner's Quick Start Guide

**Welcome!** This guide will help you get started with Taurus CLI even if you've never used a command-line tool before. We'll take it step by step, and you'll be doing useful things in about 15 minutes!

## 📖 What You'll Learn

By the end of this guide, you'll be able to:
- ✅ Install and set up Taurus CLI
- ✅ Have conversations with AI to help with coding
- ✅ Generate code automatically
- ✅ Review code for bugs
- ✅ Create documentation

**Time needed:** 15-20 minutes

---

## 🤔 What is Taurus CLI?

Think of Taurus CLI as having an expert programmer sitting next to you, ready to help 24/7. You can:
- Ask it to write code for you
- Have it check your code for mistakes
- Get explanations of how code works
- Generate entire files or projects

**CLI** means "Command Line Interface" - it's a text-based way to talk to your computer. Don't worry if that sounds scary! We'll show you exactly what to do.

---

## 🛠️ Part 1: Installation (5 minutes)

### Step 1: Install Node.js

**What is Node.js?** It's a program that lets your computer run JavaScript code. Taurus needs it to work.

**How to install:**

1. Go to [https://nodejs.org](https://nodejs.org) in your web browser
2. Click the big green button that says **"Download Node.js (LTS)"**
3. Once downloaded, open the file and follow the installer
   - Click "Next" through all the screens
   - Accept the license agreement
   - Use all the default settings
   - Click "Install" (may ask for your password)
4. When it says "Completed," click "Finish"

**How to check if it worked:**

We need to open something called a "Terminal" or "Command Prompt":

**On Windows:**
- Press the Windows key (⊞) and type `cmd`
- Click on "Command Prompt"

**On Mac:**
- Press Command (⌘) + Space
- Type `terminal`
- Press Enter

**On Linux:**
- Press Ctrl + Alt + T

You should see a window with text and a blinking cursor. This is your terminal!

Now type this command and press Enter:
```bash
node --version
```

If you see something like `v18.17.0` or `v20.9.0`, it worked! 🎉

---

### Step 2: Install Taurus CLI

Now we'll install Taurus. In the same terminal window, copy and paste this command:

```bash
npm install -g taurus-cli
```

**What does this do?**
- `npm` = Node Package Manager (installs programs)
- `install` = tells it to install something
- `-g` = install globally (available everywhere)
- `taurus-cli` = the name of the program to install

**Wait for it to finish.** You'll see text scrolling by - this is normal! When you see the cursor blinking again, it's done.

**Check if it worked:**
```bash
taurus --version
```

You should see a version number like `1.0.0`. Success! ✅

---

### Step 3: Get Your API Key

Taurus uses Claude AI (made by Anthropic) to be smart. You need an API key - think of it like a password that lets Taurus use Claude.

**How to get your API key:**

1. Go to [https://console.anthropic.com](https://console.anthropic.com)
2. Click **"Sign Up"** or **"Sign In"** if you have an account
3. Once logged in, look for **"API Keys"** in the menu
4. Click **"Create Key"**
5. Give it a name like "Taurus CLI"
6. Click **"Create Key"**
7. **IMPORTANT:** Copy the key that appears - you'll only see it once!
   - It looks like: `sk-ant-api03-abc123xyz...`

**Keep this key safe!** Don't share it with anyone - it's like your password.

---

### Step 4: First Time Setup

Now let's configure Taurus with your API key.

**In your terminal, type:**
```bash
taurus
```

The first time you run Taurus, it will ask you some questions:

**Question 1:** "API Key?"
- Paste your API key (right-click and select Paste, or Ctrl+V / Command+V)
- Press Enter

**Question 2:** "Which model would you like to use?"
- Just press Enter (uses the default, which is perfect)

**Question 3:** "Working directory?"
- Just press Enter (uses your current folder)

**That's it!** You should now see:
```
Taurus CLI v1.0.0
Type /help for available commands, or start chatting!

>
```

Congratulations! 🎉 Taurus is running!

---

## 🚀 Part 2: Your First Conversation (5 minutes)

Let's do something simple to see how it works.

### Quick Win #1: Ask Taurus to Explain Something

In the Taurus prompt (where you see `>`), type:

```
Explain what Python is in simple terms
```

Press Enter and watch! Taurus will respond with a clear explanation.

**Try a few more:**
```
What's the difference between HTML and CSS?
```

```
How does a website work?
```

**How to exit:** When you're done, type:
```
/exit
```

---

## 💪 Part 3: Quick Wins - Useful Things You Can Do (10 minutes)

Let's try some really practical tasks!

### Quick Win #2: Generate a Simple Webpage

1. Create a folder for your project:

**Windows:**
```bash
mkdir my-first-website
cd my-first-website
```

**Mac/Linux:**
```bash
mkdir my-first-website
cd my-first-website
```

**What this does:**
- `mkdir` = make directory (create a folder)
- `cd` = change directory (go into that folder)

2. Start Taurus again:
```bash
taurus
```

3. Ask Taurus to create a webpage:
```
Create a simple HTML webpage called index.html with:
- A title "My First Website"
- A heading that says "Hello, World!"
- A paragraph about yourself
- A colorful background
Make it look nice with CSS styling included.
```

4. Press Enter and wait. Taurus will create the file for you!

5. Open the file:
   - **Windows:** Type `explorer .` in terminal
   - **Mac:** Type `open .` in terminal
   - **Linux:** Type `xdg-open .` in terminal

   Find `index.html` and double-click it - it opens in your browser! 🌐

---

### Quick Win #3: Create a To-Do List App

Still in Taurus, try this:

```
Create a todo.html file with a working to-do list app. Include:
- An input box to type new tasks
- An "Add Task" button
- Tasks appear in a list below
- Each task has a delete button
- Make it colorful and easy to use
Include all the JavaScript to make it work.
```

Watch as Taurus creates a fully functional to-do list app for you! Open `todo.html` in your browser and try it out.

---

### Quick Win #4: Get Help with Code

Maybe you found some code online but don't understand it. Let's say you have this Python code:

```python
def greet(name):
    return f"Hello, {name}!"
```

Ask Taurus:
```
Explain this code like I'm 10 years old:

def greet(name):
    return f"Hello, {name}!"
```

Taurus will explain it in simple terms!

---

### Quick Win #5: Fix Code Errors

Let's say you tried to write code but got an error. Ask Taurus for help:

```
I tried to create a Python program but got this error:
"SyntaxError: invalid syntax"

Here's my code:
print("Hello World"

Can you fix it and explain what was wrong?
```

Taurus will:
1. Show you the fixed code
2. Explain what the mistake was
3. Give you tips to avoid it next time

---

### Quick Win #6: Create a Simple Calculator

Try this:

```
Create a calculator.html file with a working calculator that can:
- Add two numbers
- Subtract two numbers
- Multiply two numbers
- Divide two numbers
Make it look like a real calculator with buttons.
```

You'll have a working calculator in seconds!

---

## 🎯 Part 4: Understanding the Basics

Now that you've done some cool stuff, let's understand what's happening:

### How to Talk to Taurus

**Just be conversational!** Pretend you're talking to a helpful friend who knows programming.

**Good examples:**
```
Create a button that changes color when clicked
```

```
Write a function that finds the largest number in a list
```

```
Help me create a contact form for my website
```

**Tips for better results:**
- Be specific about what you want
- Mention the programming language if you have a preference
- Ask for explanations if you don't understand something

### Special Commands (start with `/`)

Taurus has special commands that start with `/`:

- `/help` - Shows all available commands
- `/clear` - Clears the screen
- `/exit` - Quits Taurus
- `/session list` - Shows your conversation history
- `/config` - Shows your settings

Try typing `/help` to see them all!

---

## 🔧 Part 5: Common Issues & Solutions

### Problem: "command not found: taurus"

**Solution:** The installation might not have completed. Try:
```bash
npm install -g taurus-cli
```

If that doesn't work, close your terminal completely and open a new one, then try again.

---

### Problem: "API key invalid"

**Solution:**
1. Check that you copied the entire API key (it's quite long!)
2. Make sure there are no extra spaces at the beginning or end
3. Try getting a new API key from Anthropic

To reset your API key:
```bash
taurus
```
Then press Ctrl+C to exit, and run it again to re-enter your API key.

---

### Problem: Taurus is not responding

**Solution:**
1. Wait a bit - sometimes responses take 10-30 seconds
2. Check your internet connection
3. Press Ctrl+C to cancel and try again
4. If stuck, close the terminal and open a new one

---

### Problem: "Permission denied"

**On Mac/Linux, try:**
```bash
sudo npm install -g taurus-cli
```
(You'll need to enter your computer password)

---

### Problem: I can't find the files Taurus created

**Solution:**
Files are created in your "working directory" - the folder you were in when you started Taurus.

To see where you are:
- **Windows:** Type `cd` and press Enter
- **Mac/Linux:** Type `pwd` and press Enter

To list files in current folder:
- Type `dir` (Windows) or `ls` (Mac/Linux)

---

## 🎓 Part 6: Next Steps

Congratulations! You've learned the basics. Here's what to explore next:

### 1. Learn More Commands

Try reading the full tutorials:
- [Full Quick Start Guide](./02-quickstart.md) - More detailed guide
- [Hooks Tutorial](./03-hooks.md) - Automate repetitive tasks
- [Slash Commands](./04-slash-commands.md) - Create your own shortcuts

### 2. Build a Real Project

Ideas for practice:
- **Portfolio website** - Showcase your work
- **Simple game** - Like tic-tac-toe or hangman
- **Utility tool** - Password generator, unit converter
- **Blog** - Personal blog with multiple pages

Ask Taurus:
```
Help me create a personal portfolio website with:
- A home page
- An about page
- A projects page
- A contact form
Walk me through it step by step.
```

### 3. Explore Advanced Features

Once comfortable, try:
- **Code Review:** Ask Taurus to check your code for bugs
- **Testing:** Have Taurus create tests for your code
- **Documentation:** Generate README files and documentation
- **Refactoring:** Improve existing code

---

## 💡 Pro Tips for Beginners

### Tip 1: Save Your Work
The terminal doesn't save files unless Taurus creates them. When Taurus generates code:
- It automatically saves it to a file
- The file is in your current folder
- You can always ask Taurus to show you where it saved something

### Tip 2: Ask for Explanations
Never be afraid to ask Taurus to explain:
```
Explain the code you just wrote
```

```
What does this line mean?
```

```
Why did you do it this way?
```

### Tip 3: Iterate and Improve
Don't like what Taurus created? Just ask for changes:
```
Make the background blue instead of red
```

```
Add more features to the calculator
```

```
Make this code simpler
```

### Tip 4: Learn as You Go
Each time Taurus creates something, try to understand it:
- Ask what each part does
- Experiment with changing things
- See what breaks and what works

### Tip 5: Use Real Examples
When asking for help, use real scenarios:
```
I'm creating a birthday invitation website. Help me make it colorful and fun.
```

This gives Taurus context to create exactly what you need.

---

## 📝 Practice Exercises

Try these on your own to build confidence:

### Exercise 1: Personal Greeting
```
Create a webpage that asks for my name and then shows a personalized greeting with the current date and time.
```

### Exercise 2: Color Picker
```
Create a tool where I can click buttons to change the background color of the page. Include at least 6 different colors.
```

### Exercise 3: Simple Story
```
Create an interactive story webpage where clicking buttons lets me choose what happens next. Make it fun!
```

### Exercise 4: Quote Generator
```
Create a webpage that shows a random motivational quote each time I click a button. Include at least 10 quotes.
```

### Exercise 5: Countdown Timer
```
Create a countdown timer that lets me set minutes and seconds, then counts down to zero with a beep sound.
```

---

## 🎉 You Did It!

You've completed the Absolute Beginner's Quick Start Guide! You now know how to:

- ✅ Install and run Taurus CLI
- ✅ Have conversations with AI
- ✅ Generate working code
- ✅ Create web pages and apps
- ✅ Get help and explanations
- ✅ Troubleshoot common problems

**Remember:** Programming is about solving problems creatively. Taurus is your assistant to help you bring ideas to life, even if you're just starting out!

---

## 🆘 Need More Help?

- **Got stuck?** Try typing `/help` in Taurus
- **Want more tutorials?** Check out the [Tutorials Index](./README.md)
- **Have questions?** Visit [GitHub Discussions](https://github.com/az9713/taurus-cli/discussions)
- **Found a bug?** Report it at [GitHub Issues](https://github.com/az9713/taurus-cli/issues)

---

## 🚀 Keep Learning!

**Next recommended tutorials:**
1. [Full Quick Start Guide](./02-quickstart.md) - More features and examples
2. [Slash Commands Tutorial](./04-slash-commands.md) - Create shortcuts
3. [Code Review Workflow](./09-code-review-workflow.md) - Check code quality

**Remember:** Everyone starts as a beginner. The more you practice with Taurus, the more comfortable you'll become with programming. Don't be afraid to experiment and make mistakes - that's how you learn!

**Happy coding!** 🎈
