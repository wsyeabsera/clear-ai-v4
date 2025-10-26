import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import mongoose from 'mongoose';
import { Author } from './models/Author';
import { Blog } from './models/Blog';
import { Comment } from './models/Comment';
import { Picture } from './models/Picture';

const PROTO_PATH = path.join(__dirname, '../../shared/dist/proto/mcp_tools.proto');
const PORT = process.env.MCP_SERVER_PORT || 50051;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/clear-ai-blog';

// Define blog CRUD tools
const blogTools = [
  {
    name: 'createBlog',
    description: 'Create a new blog post',
    category: 'blog',
    inputSchema: { type: 'object', properties: { title: 'string', content: 'string', authorId: 'string' }, required: ['title', 'content', 'authorId'] },
  },
  {
    name: 'getBlog',
    description: 'Get a blog post by ID',
    category: 'blog',
    inputSchema: { type: 'object', properties: { id: 'string' }, required: ['id'] },
  },
  {
    name: 'updateBlog',
    description: 'Update a blog post',
    category: 'blog',
    inputSchema: { type: 'object', properties: { id: 'string', title: 'string', content: 'string' }, required: ['id'] },
  },
  {
    name: 'deleteBlog',
    description: 'Delete a blog post',
    category: 'blog',
    inputSchema: { type: 'object', properties: { id: 'string' }, required: ['id'] },
  },
  {
    name: 'listBlogs',
    description: 'List all blog posts',
    category: 'blog',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
];

const authorTools = [
  {
    name: 'createAuthor',
    description: 'Create a new author',
    category: 'author',
    inputSchema: { type: 'object', properties: { name: 'string', email: 'string', bio: 'string' }, required: ['name', 'email'] },
  },
  {
    name: 'getAuthor',
    description: 'Get an author by ID',
    category: 'author',
    inputSchema: { type: 'object', properties: { id: 'string' }, required: ['id'] },
  },
  {
    name: 'updateAuthor',
    description: 'Update an author',
    category: 'author',
    inputSchema: { type: 'object', properties: { id: 'string', name: 'string', email: 'string', bio: 'string' }, required: ['id'] },
  },
  {
    name: 'deleteAuthor',
    description: 'Delete an author',
    category: 'author',
    inputSchema: { type: 'object', properties: { id: 'string' }, required: ['id'] },
  },
  {
    name: 'listAuthors',
    description: 'List all authors',
    category: 'author',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
];

const commentTools = [
  {
    name: 'createComment',
    description: 'Create a comment on a blog post',
    category: 'comment',
    inputSchema: { type: 'object', properties: { blogId: 'string', authorId: 'string', content: 'string' }, required: ['blogId', 'authorId', 'content'] },
  },
  {
    name: 'getComment',
    description: 'Get a comment by ID',
    category: 'comment',
    inputSchema: { type: 'object', properties: { id: 'string' }, required: ['id'] },
  },
  {
    name: 'deleteComment',
    description: 'Delete a comment',
    category: 'comment',
    inputSchema: { type: 'object', properties: { id: 'string' }, required: ['id'] },
  },
  {
    name: 'listCommentsByBlog',
    description: 'List all comments for a blog post',
    category: 'comment',
    inputSchema: { type: 'object', properties: { blogId: 'string' }, required: ['blogId'] },
  },
];

const pictureTools = [
  {
    name: 'createPicture',
    description: 'Create a picture for a blog post',
    category: 'picture',
    inputSchema: { type: 'object', properties: { blogId: 'string', url: 'string', caption: 'string' }, required: ['blogId', 'url'] },
  },
  {
    name: 'getPicture',
    description: 'Get a picture by ID',
    category: 'picture',
    inputSchema: { type: 'object', properties: { id: 'string' }, required: ['id'] },
  },
  {
    name: 'deletePicture',
    description: 'Delete a picture',
    category: 'picture',
    inputSchema: { type: 'object', properties: { id: 'string' }, required: ['id'] },
  },
  {
    name: 'listPicturesByBlog',
    description: 'List all pictures for a blog post',
    category: 'picture',
    inputSchema: { type: 'object', properties: { blogId: 'string' }, required: ['blogId'] },
  },
];

const allTools = [...blogTools, ...authorTools, ...commentTools, ...pictureTools];

async function startServer() {
  // Connect to MongoDB
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }

  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });

  const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;
  const toolService = protoDescriptor.mcp.ToolService;

  const server = new grpc.Server();

  server.addService(toolService.service, {
    ListTools: (call: any, callback: any) => {
      const request = call.request;

      let tools = allTools;

      // Filter by category if provided
      if (request.category) {
        tools = tools.filter((tool) => tool.category === request.category);
      }

      callback(null, { tools });
    },

    CallTool: async (call: any, callback: any) => {
      const { toolName, parameters } = call.request;

      const tool = allTools.find((t) => t.name === toolName);

      if (!tool) {
        callback({
          code: grpc.status.NOT_FOUND,
          message: `Tool "${toolName}" not found`,
        });
        return;
      }

      // Execute tool based on name
      try {
        let result: any = { success: false, message: '', output: '' };

        switch (toolName) {
          // Blog tools
          case 'createBlog': {
            const blog = await Blog.create({ title: parameters.title, content: parameters.content, authorId: parameters.authorId });
            result = { success: true, message: 'Blog created', output: JSON.stringify(blog) };
            break;
          }
          case 'getBlog': {
            const blog = await Blog.findById(parameters.id);
            result = { success: true, message: 'Blog retrieved', output: JSON.stringify(blog) };
            break;
          }
          case 'updateBlog': {
            const blog = await Blog.findByIdAndUpdate(parameters.id, { title: parameters.title, content: parameters.content }, { new: true });
            result = { success: true, message: 'Blog updated', output: JSON.stringify(blog) };
            break;
          }
          case 'deleteBlog': {
            await Blog.findByIdAndDelete(parameters.id);
            result = { success: true, message: 'Blog deleted', output: JSON.stringify({ success: true }) };
            break;
          }
          case 'listBlogs': {
            const blogs = await Blog.find();
            result = { success: true, message: 'Blogs retrieved', output: JSON.stringify(blogs) };
            break;
          }

          // Author tools
          case 'createAuthor': {
            const author = await Author.create({ name: parameters.name, email: parameters.email, bio: parameters.bio || '' });
            result = { success: true, message: 'Author created', output: JSON.stringify(author) };
            break;
          }
          case 'getAuthor': {
            const author = await Author.findById(parameters.id);
            result = { success: true, message: 'Author retrieved', output: JSON.stringify(author) };
            break;
          }
          case 'updateAuthor': {
            const updateData: any = {};
            if (parameters.name) updateData.name = parameters.name;
            if (parameters.email) updateData.email = parameters.email;
            if (parameters.bio) updateData.bio = parameters.bio;
            const author = await Author.findByIdAndUpdate(parameters.id, updateData, { new: true });
            result = { success: true, message: 'Author updated', output: JSON.stringify(author) };
            break;
          }
          case 'deleteAuthor': {
            await Author.findByIdAndDelete(parameters.id);
            result = { success: true, message: 'Author deleted', output: JSON.stringify({ success: true }) };
            break;
          }
          case 'listAuthors': {
            const authors = await Author.find();
            result = { success: true, message: 'Authors retrieved', output: JSON.stringify(authors) };
            break;
          }

          // Comment tools
          case 'createComment': {
            const comment = await Comment.create({ blogId: parameters.blogId, authorId: parameters.authorId, content: parameters.content });
            result = { success: true, message: 'Comment created', output: JSON.stringify(comment) };
            break;
          }
          case 'getComment': {
            const comment = await Comment.findById(parameters.id);
            result = { success: true, message: 'Comment retrieved', output: JSON.stringify(comment) };
            break;
          }
          case 'deleteComment': {
            await Comment.findByIdAndDelete(parameters.id);
            result = { success: true, message: 'Comment deleted', output: JSON.stringify({ success: true }) };
            break;
          }
          case 'listCommentsByBlog': {
            const comments = await Comment.find({ blogId: parameters.blogId });
            result = { success: true, message: 'Comments retrieved', output: JSON.stringify(comments) };
            break;
          }

          // Picture tools
          case 'createPicture': {
            const picture = await Picture.create({ blogId: parameters.blogId, url: parameters.url, caption: parameters.caption || '' });
            result = { success: true, message: 'Picture created', output: JSON.stringify(picture) };
            break;
          }
          case 'getPicture': {
            const picture = await Picture.findById(parameters.id);
            result = { success: true, message: 'Picture retrieved', output: JSON.stringify(picture) };
            break;
          }
          case 'deletePicture': {
            await Picture.findByIdAndDelete(parameters.id);
            result = { success: true, message: 'Picture deleted', output: JSON.stringify({ success: true }) };
            break;
          }
          case 'listPicturesByBlog': {
            const pictures = await Picture.find({ blogId: parameters.blogId });
            result = { success: true, message: 'Pictures retrieved', output: JSON.stringify(pictures) };
            break;
          }

          default:
            result = { success: false, message: 'Tool execution not implemented', output: '' };
        }

        callback(null, result);
      } catch (error: any) {
        callback(null, { success: false, message: error.message, output: '' });
      }
    },
  });

  server.bindAsync(
    `0.0.0.0:${PORT}`,
    grpc.ServerCredentials.createInsecure(),
    (error) => {
      if (error) {
        console.error('Failed to start MCP server:', error);
        process.exit(1);
      }

      server.start();
      console.log(`🚀 MCP Server listening on 0.0.0.0:${PORT}`);
      console.log(`📋 Serving ${allTools.length} tools`);
    }
  );
}

startServer();
