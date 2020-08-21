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
let fullTickets = [];

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

  function removeTicket(context) {
    const { ticketId } = context.request.query;
    try {
      tickets = tickets.filter((item) => item.id !== ticketId);
      fullTickets = fullTickets.filter((item) => item.id !== ticketId);

      return { removed: true };
    } catch (err) {
      return { removed: false , err };
    }
  }

  function checkTicket(context) {
    const { ticketId } = context.request.query;

    try {
      const ticket = tickets.find((item) => item.id === ticketId);
      if (ticket.status === false) {
        ticket.status = true;
      } else {
        ticket.status = false;
      }

      const fullTicket = fullTickets.find((item) => item.id === ticketId);
      if (fullTicket.status === false) {
        fullTicket.status = true;
      } else {
        fullTicket.status = false;
      }
      return { done: true, status: ticket.status };
    } catch (err) {
      return { done: false, err };
    }
  }

  function editTicket(context) {
    const data = JSON.parse(context.request.body);
    const { name, description, id } = data;

    try {
      const ticket = tickets.find((item) => item.id === id);
      ticket.name = name;

      const fullTicket = fullTickets.find((item) => item.id === id);
      fullTicket.name = name;
      fullTicket.description = description;

      return { edited: true, name, description };
    } catch(err) {
      return { edited: false, err };
    }
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
    case 'removeTicket':
      ctx.response.body = removeTicket(ctx);
      return;
    case 'checkTicket':
      ctx.response.body = checkTicket(ctx);
      return;
    case 'editTicket':
      ctx.response.body = editTicket(ctx);
      return;
    default:
      ctx.response.status = 404;
  }
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log('\nServer started...');
});
