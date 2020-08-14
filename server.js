/* eslint-disable consistent-return */
/* eslint-disable no-return-await */
const Koa = require('koa');
const koaBody = require('koa-body');
const uuid = require('uuid');
const port = process.env.PORT || 7070;

const app = new Koa();
app.use(koaBody({
  urlencoded: true,
}));

app.use(async (ctx, next) => {
  const origin = ctx.request.get('Origin');
  if (!origin) {
    return await next();
  }
  const headers = { 'Access-Control-Allow-Origin': '*' };
  if (ctx.request.method !== 'OPTIONS') {
    ctx.response.set({ ...headers });
    try {
      return await next();
    } catch (e) {
      e.headers = { ...e.headers, ...headers };
      throw e;
    }
  }
  if (ctx.request.get('Access-Control-Request-Method')) {
    ctx.response.set({
      ...headers,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH',
    });
    if (ctx.request.get('Access-Control-Request-Headers')) {
      ctx.response.set('Access-Control-Allow-Headers', ctx.request.get('Access-Control-Allow-Request-Headers'));
    }
    ctx.response.status = 204; // No content
  }
});

let tickets = [];
const fullTickets = [];

app.use(async (ctx) => {
  const { method } = ctx.request.query;

  function getTicketById(context) {
    const { ticketId } = context.request.query;
    const ticket = fullTickets.find((item) => item.id === ticketId);
    return ticket;
  }

  function filterTickets() {
    tickets = fullTickets.map((item) => ({
      id: item.id,
      name: item.name,
      status: item.status,
      created: item.created,
    }));
  }

  function createTicket(context) {
    const data = JSON.parse(context.request.body);
    const { name, description } = data;

    const newTicket = {
      id: uuid.v4(),
      name,
      description,
      status: false,
      created: Date.now(),
    };

    fullTickets.push(newTicket);
    filterTickets();
    return newTicket;
  }

  switch (method) {
    case 'allTickets':
      ctx.response.body = tickets;
      return;
    case 'ticketById':
      ctx.response.body = getTicketById(ctx);
      return;
    case 'createTicket':
      ctx.response.body = createTicket(ctx);
      return;
    default:
      ctx.response.status = 404;
  }
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log('\nServer started...');
});
