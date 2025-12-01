# **Nexus Fast Mini**

Nexus Fast Mini is a multi-model reasoning framework built around a simple idea:
combine several specialized models, collect their perspectives, synthesize them, and produce a single high-quality answer.

This project provides the full TypeScript implementation of the Nexus pipeline, including:

* Seven independent “thinker” models
* A condenser stage that merges their insights
* A chief reasoner that generates the final response
* Streaming and non-streaming output modes
* A clean developer API for integration

Nexus does not train or host models.
Instead, it orchestrates external LLMs through the OpenRouter API.

---

## **How It Works**

### **1. Thinkers**

Nexus runs 7 models in parallel.
Each one plays a specific role such as:

* Strategic analysis
* Critical review
* Creative alternatives
* Technical evaluation
* UX considerations
* Data-driven reasoning
* Optimization and simplification

Each thinker produces a structured analysis.

### **2. Condenser**

The condenser receives all thinker outputs and creates:

1. Consensus points
2. Disagreements
3. A merged synthesis
4. A short list of recommended actions

This stage reduces multiple viewpoints into a single brief.

### **3. Chief Reasoner**

The chief takes the condensed summary and writes the final answer.
It supports several output styles:

* **concise**
* **detailed**
* **structured**
* **writing**
* **coding**

The chief produces the final, unified response.

## **Model Selection**

The default models are defined at the top of the file.
You are free to replace them with any models supported by OpenRouter.

Each thinker can be customized with:

```ts
{
  model: string;
  role: string;
  prompt: string;
}
```
---

## **Design Goals**

* Straightforward code that is easy to read and modify
* No hidden logic or opaque abstractions
* Fully deterministic structure with clear model roles
* Works with any OpenRouter-compatible endpoint
* Suitable for experimentation, extensions, or academic use

---

## **Notes**

* This project does not include any model weights.
* All calls depend on the user’s OpenRouter key and quotas.
* For custom deployments, modify or replace the OpenRouter client instance.
