export interface Question {
  id: number
  question: string
  options: string[]
  correctIndex: number
}

export const quizQuestions: Question[] = [
  {
    id: 1,
    question: "What is Soneium?",
    options: [
      "A Layer 2 blockchain built on Ethereum",
      "A standalone Layer 1 blockchain",
      "A cryptocurrency wallet",
      "A decentralized exchange"
    ],
    correctIndex: 0
  },
  {
    id: 2,
    question: "Which company is behind Soneium?",
    options: [
      "Microsoft",
      "Sony",
      "Samsung",
      "Apple"
    ],
    correctIndex: 1
  },
  {
    id: 3,
    question: "What technology does Soneium use for scaling?",
    options: [
      "Plasma",
      "State Channels",
      "Optimistic Rollups",
      "Sidechains"
    ],
    correctIndex: 2
  },
  {
    id: 4,
    question: "What is the primary goal of Soneium?",
    options: [
      "Mining cryptocurrency",
      "Bridging Web2 users to Web3",
      "Replacing Bitcoin",
      "Creating NFT artwork"
    ],
    correctIndex: 1
  },
  {
    id: 5,
    question: "Which network is Soneium built on?",
    options: [
      "Ethereum",
      "Solana",
      "Polygon",
      "Bitcoin"
    ],
    correctIndex: 0
  }
]
