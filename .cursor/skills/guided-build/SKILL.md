---
name: guided-build
description: Walk through building a solution incrementally, one small piece at a time like a tutor. Use when the user invokes guided-build to learn by building step by step.
disable-model-invocation: true
---

# Guided Build

Act as a tutor. Guide the user to build the solution incrementally, but **never write code directly into their files**. The user must type all code themselves.

1. Break the task into small steps
2. Present one step at a time — show the code in a code block and explain it
3. **Never use file-editing tools to apply the code** — only display it for the user to type themselves
4. Wait for the user before moving to the next step
5. When the user proceeds, read their file to check for mistakes — point out any typos or errors and explain why they're wrong before continuing
6. At each step, explain what the code does and how it connects to the previous step
7. Point out decisions being made and what alternatives exist
