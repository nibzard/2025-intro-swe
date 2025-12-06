# Advanced Notifications System

## 📬 Overview

Napredni notifikacijski sistem sa real-time ažuriranjima koji omogućuje korisnicima da primaju instant obavijesti o aktivnostima na forumu.

## ✨ Features

### 🔔 Notification Types

1. **Reply to Topic** - Kada netko odgovori na tvoju temu
2. **Reply to Reply** - Kada netko odgovori na tvoj komentar
3. **Upvote** - Kada netko upvote-a tvoj odgovor
4. **Topic Pinned** - Kada admin prikvači tvoju temu
5. **Topic Locked** - Kada admin zaključa tvoju temu
6. **Mention** - Kada te netko spomene (pripremljeno za budućnost)

### 🚀 Real-time Updates

- **Supabase Realtime** - Instant notifikacije bez refreshanja stranice
- **Live Badge Count** - Brojač nepročitanih notifikacija se ažurira u real-time
- **Auto-refresh** - Nova notifikacija se automatski pojavi u listi

### 🎨 User Interface

#### Notification Bell
- Ikona zvona u navigacijskoj traci
- Crveni badge sa brojem nepročitanih notifikacija
- Klik otvara dropdown sa najnovijim notifikacijama
- Podržava dark mode

#### Notification Dropdown
- Lista do 20 najnovijih notifikacija
- Ikone prema tipu notifikacije
- Relativno vrijeme (npr. "Prije 5 min")
- Klik na notifikaciju vodi na odgovarajući link
- "Vidi sve obavijesti" link

#### Notifications Page (`/notifications`)
- Potpuna stranica sa svim notifikacijama
- Real-time updates
- Bulk actions (mark all as read)
- Pojedinačno brisanje notifikacija

### ⚡ Actions

- **Mark as Read** - Automatski se označava kao pročitano pri kliku
- **Mark All as Read** - Označi sve notifikacije kao pročitane
- **Delete** - Obriši pojedinačnu notifikaciju
- **Navigate** - Klik vodi na povezanu temu/odgovor

## 🏗️ Architecture

### Database Schema

```sql
-- Notification types
create type notification_type as enum (
  'reply_to_topic',
  'reply_to_reply',
  'upvote',
  'topic_pinned',
  'topic_locked',
  'mention'
);

-- Notifications table
create table notifications (
  id uuid primary key,
  user_id uuid references profiles(id),
  type notification_type,
  title text,
  message text,
  link text,
  is_read boolean default false,
  actor_id uuid references profiles(id),
  topic_id uuid references topics(id),
  reply_id uuid references replies(id),
  created_at timestamp
);
```

### Database Triggers

Notifikacije se automatski kreiraju pomoću PostgreSQL triggera:

1. **on_reply_created** - Kada se kreira novi odgovor
   - Notificira autora teme
   - Notificira autora parent reply-a (ako postoji)

2. **on_vote_created** - Kada netko glasuje
   - Notificira autora odgovora (samo za upvote)

3. **on_topic_pinned** - Kada admin prikvači temu
   - Notificira autora teme

### Components Structure

```
components/
  notifications/
    notification-bell.tsx      # Bell icon with badge
    notification-list.tsx      # Dropdown notification list

app/
  notifications/
    actions.ts                 # Server actions
    page.tsx                   # Full notifications page
    notification-page-client.tsx  # Client component

types/
  notifications.ts             # TypeScript types
```

## 📝 Implementation Details

### Real-time Subscription

```typescript
const channel = supabase
  .channel('notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${user.id}`
  }, (payload) => {
    // Handle new notification
  })
  .subscribe();
```

### Smart Notification Logic

- **Prevent Self-notifications** - Korisnici ne primaju notifikacije za vlastite akcije
- **Deduplication** - Trigger funkcije provjeravaju duplikate
- **Context-aware** - Notifikacije sadrže sve potrebne informacije (actor, link, etc.)

## 🔧 Configuration

### Supabase Setup

1. **Run SQL Scripts**
   ```bash
   # First run schema.sql
   # Then run notifications.sql
   ```

2. **Enable Realtime**
   - Go to Supabase Dashboard
   - Database > Replication
   - Enable realtime for `notifications` table

3. **RLS Policies**
   - Users can only see their own notifications
   - System can insert notifications
   - Users can update/delete their own notifications

## 🎯 Usage

### For Users

1. **View Notifications** - Klik na bell icon u navbaru
2. **Read Notification** - Klik na notifikaciju automatski je označava kao pročitanu
3. **Mark All as Read** - Klik na checkmark icon
4. **Delete** - Klik na X za brisanje pojedinačne notifikacije
5. **View All** - Klik "Vidi sve obavijesti" za full page view

### For Developers

```typescript
// Manually create notification
await create_notification(
  user_id,
  'reply_to_topic',
  'Novi odgovor',
  'Netko je odgovorio na tvoju temu',
  '/forum/topic/slug',
  actor_id,
  topic_id,
  reply_id
);
```

## 🔮 Future Enhancements

- [ ] Email notifications (digest)
- [ ] Push notifications (PWA)
- [ ] Notification preferences
- [ ] Mention system (@username)
- [ ] Notification grouping (e.g., "3 people replied")
- [ ] Mark as unread
- [ ] Notification filters

## 🐛 Troubleshooting

### Notifications not appearing in real-time?
- Check if Realtime is enabled for `notifications` table
- Verify RLS policies are correct
- Check browser console for subscription errors

### Badge count incorrect?
- Check database constraints
- Verify is_read field is being updated correctly

### Missing notifications?
- Check database triggers are installed
- Verify function permissions
- Check error logs in Supabase

## 📊 Performance

- **Database Indexes** - Optimizirani upiti za brzo dohvaćanje
- **Limit Results** - Dropdown pokazuje max 20 notifikacija
- **Efficient Queries** - Join samo potrebnih podataka
- **Real-time Channels** - Minimalan overhead

## 🔒 Security

- **Row Level Security** - Korisnici vide samo svoje notifikacije
- **Server-side Actions** - Sve akcije provjeravaju autentifikaciju
- **SQL Injection Prevention** - Prepared statements
- **XSS Protection** - Sanitizirani output
