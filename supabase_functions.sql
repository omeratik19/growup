-- Yorum sayısını artıran fonksiyon
CREATE OR REPLACE FUNCTION increment_comments(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts 
  SET comments = COALESCE(comments, 0) + 1 
  WHERE id = post_id;
  
  RAISE NOTICE 'Comments incremented for post %', post_id;
END;
$$ LANGUAGE plpgsql;

-- Yorum sayısını azaltan fonksiyon
CREATE OR REPLACE FUNCTION decrement_comments(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts 
  SET comments = GREATEST(COALESCE(comments, 0) - 1, 0) 
  WHERE id = post_id;
  
  RAISE NOTICE 'Comments decremented for post %', post_id;
END;
$$ LANGUAGE plpgsql; 