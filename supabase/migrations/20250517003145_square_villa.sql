/*
  # Initial Schema Setup for MumbleChat

  1. New Tables
    - channels
      - id (uuid, primary key)
      - name (text)
      - description (text)
      - created_at (timestamptz)
      - created_by (text)
      - is_private (boolean)
      - last_message_at (timestamptz)
    
    - messages
      - id (uuid, primary key)
      - channel_id (uuid, foreign key)
      - sender (text)
      - content (text)
      - created_at (timestamptz)
      - is_encrypted (boolean)
    
    - channel_participants
      - channel_id (uuid, foreign key)
      - user_address (text)
      - joined_at (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create channels table
CREATE TABLE channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  created_by text NOT NULL,
  is_private boolean DEFAULT false,
  last_message_at timestamptz DEFAULT now()
);

-- Create messages table
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid REFERENCES channels(id) ON DELETE CASCADE,
  sender text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  is_encrypted boolean DEFAULT false
);

-- Create channel participants table
CREATE TABLE channel_participants (
  channel_id uuid REFERENCES channels(id) ON DELETE CASCADE,
  user_address text NOT NULL,
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (channel_id, user_address)
);

-- Enable RLS
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_participants ENABLE ROW LEVEL SECURITY;

-- Channels policies
CREATE POLICY "Users can view public channels"
  ON channels
  FOR SELECT
  TO authenticated
  USING (
    NOT is_private OR
    EXISTS (
      SELECT 1 FROM channel_participants
      WHERE channel_id = channels.id
      AND user_address = auth.jwt()->>'sub'
    )
  );

CREATE POLICY "Users can create channels"
  ON channels
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.jwt()->>'sub');

-- Messages policies
CREATE POLICY "Users can view messages in their channels"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM channel_participants
      WHERE channel_id = messages.channel_id
      AND user_address = auth.jwt()->>'sub'
    )
  );

CREATE POLICY "Users can send messages to their channels"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM channel_participants
      WHERE channel_id = messages.channel_id
      AND user_address = auth.jwt()->>'sub'
    )
  );

-- Channel participants policies
CREATE POLICY "Users can view channel participants"
  ON channel_participants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM channel_participants cp
      WHERE cp.channel_id = channel_participants.channel_id
      AND cp.user_address = auth.jwt()->>'sub'
    )
  );

CREATE POLICY "Users can join channels"
  ON channel_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (user_address = auth.jwt()->>'sub');