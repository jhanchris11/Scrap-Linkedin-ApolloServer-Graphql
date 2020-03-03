const { ApolloServer, gql } = require('apollo-server')
import Contact from './Contact';
import Job from './Job';

let dataContact = []
let dataJob = []

const typeDefs = gql`
type Query {
    Contacts :[Contact]
    Jobs :[Job]
}
type Contact {
    name: String
    ocupation: String
    image: String
}
type Job {
    business:String
    location:String
    position:String
    logo:String
}
`
const resolvers = {
    Query: {
        Contacts: () => dataContact,
        Jobs: () => dataJob
    }
}

class Init {
    constructor() {
        this.start();
    }

    async start() {
        dataContact = await Contact();
        dataJob = await Job();

        const server = await new ApolloServer({ typeDefs, resolvers });

        server.listen().then(({ url }) => {
            console.log(`🚀  Server ready at ${url}`)
        })
    }
}
new Init();